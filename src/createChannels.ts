import { Channel, createChannel } from "./createChannel";
import { ChannelKey, createGetChanelKey } from "./createQueryKey";
import { Query, QueryAction, QueryOptions } from "./types/query";

export function createChannels() {
  const getChannelKey = createGetChanelKey()
  const channels = new Map<ChannelKey, Channel>()

  function getChannel<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    const queryKey = getChannelKey(action, parameters)

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