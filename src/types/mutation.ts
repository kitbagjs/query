import { RetryOptions } from "@/utilities/retry"
import { QueryTag, QueryTagType } from "./tags"
import { DefaultValue } from "./utilities"

export type MutationAction = (...args: any[]) => any

export type MutationData<
  TAction extends MutationAction
> = Awaited<ReturnType<TAction>>

export type MutationTags<
  TAction extends MutationAction = MutationAction,
> = QueryTag[] | ((value: MutationData<TAction>) => QueryTag[])

export type MutationTagsType<
  TTags extends MutationTags
> = TTags extends QueryTag[]
  ? QueryTagType<TTags[number]>
  : TTags extends (value: MutationData<MutationAction>) => QueryTag[]
    ? QueryTagType<ReturnType<TTags>[number]>
    : never

export type OnExecuteContext<
  TAction extends MutationAction,
> = {
  payload: Parameters<TAction>,
}

export type OnSuccessContext<
  TAction extends MutationAction,
> = {
  payload: Parameters<TAction>,
  data: MutationData<TAction>,
}

export type SetQueryDataBeforeContext<
  TAction extends MutationAction,
> = {
  payload: Parameters<TAction>,
}

export type SetQueryDataAfterContext<
  TAction extends MutationAction,
> = {
  payload: Parameters<TAction>,
  data: MutationData<TAction>,
}

export type OnErrorContext<
  TAction extends MutationAction,
> = {
  payload: Parameters<TAction>,
  error: unknown,
}

export type MutationOptions<
  TAction extends MutationAction,
  TPlaceholder extends unknown,
  TTags extends MutationTags,
> = {
  placeholder?: TPlaceholder,
  tags?: TTags,
  refreshQueryData?: boolean,
  retries?: number | Partial<RetryOptions>,
  onExecute?: (context: OnExecuteContext<TAction>) => void,
  onSuccess?: (context: OnSuccessContext<TAction>) => void,
  onError?: (context: OnErrorContext<TAction>) => void,
  setQueryDataBefore?: (queryData: MutationTagsType<TTags>, context: SetQueryDataBeforeContext<TAction>) => MutationTagsType<TTags>,
  setQueryDataAfter?: (queryData: MutationTagsType<TTags>, context: SetQueryDataAfterContext<TAction>) => MutationTagsType<TTags>,
}

export type Mutation<
  TAction extends MutationAction,
  TPlaceholder extends unknown,
> = PromiseLike<AwaitedMutation<TAction>> & {
  data: MutationData<TAction> | DefaultValue<TPlaceholder, undefined>,
  executing: boolean,
  executed: boolean,
  error: unknown,
  errored: boolean,
  mutate: (...args: Parameters<TAction>) => Promise<MutationData<TAction>>,
}

export type AwaitedMutation<
  TAction extends MutationAction,
> = {
  data: MutationData<TAction>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
}

export type MutationFunction = <
  const TAction extends MutationAction,
  const TPlaceholder extends unknown,
  const TTags extends MutationTags<TAction>,
>(action: TAction, args: Parameters<TAction>, options?: MutationOptions<TAction, TPlaceholder, TTags>) => PromiseLike<AwaitedMutation<TAction>> & Mutation<TAction, TPlaceholder>

export type DefinedMutationFunction<
  TDefinedAction extends MutationAction,
  TDefinedPlaceholder extends unknown,
> = <
  const TPlaceholder extends unknown,
  const TTags extends MutationTags<TDefinedAction>
>(args: Parameters<TDefinedAction>, options?: MutationOptions<TDefinedAction, TPlaceholder, TTags>) => Mutation<TDefinedAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>

export type MutationComposition = <
  const TAction extends MutationAction,
  const TPlaceholder extends unknown,
  const TTags extends MutationTags<TAction>,
>(action: TAction, options?: MutationOptions<TAction, TPlaceholder, TTags>) => Mutation<TAction, TPlaceholder>

export type DefinedMutationComposition<
  TDefinedAction extends MutationAction,
  TDefinedPlaceholder extends unknown,
> = <
  const TPlaceholder extends unknown,
  const TTags extends MutationTags<TDefinedAction>
>(options?: MutationOptions<TDefinedAction, TPlaceholder, TTags>) => Mutation<TDefinedAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>

export type DefinedMutation<
  TAction extends MutationAction,
  TPlaceholder extends unknown,
> = {
  mutate: DefinedMutationFunction<TAction, TPlaceholder>,
  useMutation: DefinedMutationComposition<TAction, TPlaceholder>,
}

export type DefineMutation = <
  const TAction extends MutationAction,
  const TPlaceholder extends unknown,
  const TTags extends MutationTags<TAction>,
>(action: TAction, options?: MutationOptions<TAction, TPlaceholder, TTags>) => DefinedMutation<TAction, TPlaceholder>

