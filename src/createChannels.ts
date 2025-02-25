import { Channel, createChannel } from "./createChannel";
import { createSequence } from "./createSequence";
import { Query, QueryAction, QueryOptions } from "./types/query";

type ChannelKey = `${number}-${string}`

export function createChannels() {
  const createActionId = createSequence()
  const actions = new Map<QueryAction, number>()
  const channels = new Map<ChannelKey, Channel>()

  function createChannelKey(action: QueryAction, args: Parameters<QueryAction>): ChannelKey {
    if (!actions.has(action)) {
      actions.set(action, createActionId())
    }

    const actionValue = actions.get(action)!

    return `${actionValue}-${JSON.stringify(args)}`
  }

  function getChannel<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    const queryKey = createChannelKey(action, parameters)

    if(!channels.has(queryKey)) {
      channels.set(queryKey, createChannel(action, parameters))
    }

    return channels.get(queryKey)!
  }

  function createQuery<
    const TAction extends QueryAction,
    const TOptions extends QueryOptions<TAction>
  >(action: TAction, parameters: Parameters<TAction>, options?: TOptions): Query<TAction, TOptions> {
    const channel = getChannel(action, parameters)

    return channel.subscribe(options)
  }

  return {
    createQuery,
  }
}