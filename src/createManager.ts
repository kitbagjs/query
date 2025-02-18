import { Channel, createChannel } from "./createChannel";
import { ClientOptions, Query, QueryAction, QueryOptions } from "./types";
import { createGetQueryKey, QueryKey } from "./createQueryKey";
import { reactive, toRefs } from "vue";

export function createManager(options?: ClientOptions) {
  const getQueryKey = createGetQueryKey()
  const channels = new Map<QueryKey, Channel>()

  function getChannel<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    const queryKey = getQueryKey(action, parameters)

    if(!channels.has(queryKey)) {
      channels.set(queryKey, createChannel(action, parameters))
    }

    return channels.get(queryKey)!
  }

  function deleteChannel<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): void {
    const queryKey = getQueryKey(action, parameters)

    channels.delete(queryKey)
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