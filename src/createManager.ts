import { reactive, toRefs } from "vue";
import { Channel, createChannel } from "./createChannel";
import { CreateClientOptions, Query, QueryAction, QueryOptions } from "./types";

export function createManager(options?: CreateClientOptions) {
  // might want to flatten this to a single map for simpler lookups
  const channels = new Map<QueryAction, Map<string, Channel>>()

  // should this be more elegant?
  // this would break if there are function args I believe
  function getParametersSignature(args: any[]): string {
    return JSON.stringify(args)
  }
  
  function getChannel<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    if(!channels.has(action)) {
      channels.set(action, new Map())
    }

    const actionChannels = channels.get(action)!
    const argsString = getParametersSignature(parameters)

    if(!actionChannels.has(argsString)) {
      actionChannels.set(argsString, createChannel(action, parameters))
    }

    const channel = actionChannels.get(argsString)!

    return channel
  }

  function deleteChannel<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): void {
    const argsString = getParametersSignature(parameters)

    channels.get(action)?.delete(argsString)
  }

  function subscribe<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>, options?: QueryOptions<TAction>): Query<TAction> {
    const channel = getChannel(action, parameters)

    const query = channel.subscribe(options)

    return reactive({
      ...toRefs(query),
      dispose: () => {
        query.dispose()

        // todo: the channel should mark itself as inactive and let garbage collection handle it
        if(channel.subscriptions.size === 0) {
          deleteChannel(action, parameters)
        }
      }
    })
  }

  return {
    subscribe
  }
}