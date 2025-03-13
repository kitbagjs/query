export type MutationAction = (...args: any[]) => any

export type MutationOptions<
  TAction extends MutationAction
> = {
  placeholder?: any,
  tags?: any,
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
}

export type Mutation<
  TAction extends MutationAction,
  TOptions extends MutationOptions<TAction>
> = {
  data: Awaited<ReturnType<TAction>> | TOptions['placeholder'],
  executing: boolean,
  executed: boolean,
  error: unknown,
  errored: boolean,
}

export type AwaitedMutation<
  TAction extends MutationAction,
> = {
  data: Awaited<ReturnType<TAction>>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
}

export type MutationFunction = <
  const TAction extends MutationAction,
  const TOptions extends MutationOptions<TAction>
>(action: TAction, args: Parameters<TAction>, options?: TOptions) => PromiseLike<AwaitedMutation<TAction>> & Mutation<TAction, TOptions>

export type DefinedMutationFunction<
  TAction extends MutationAction,
  TOptions extends MutationOptions<TAction>
> = (args: Parameters<TAction>, options?: TOptions) => Mutation<TAction, TOptions>

type Mutate<
  TAction extends MutationAction
> = (...args: Parameters<TAction>) => ReturnType<TAction>

export type MutationComposition = <
  const TAction extends MutationAction,
  const TOptions extends MutationOptions<TAction>
>(action: TAction, options?: TOptions) => { mutate: Mutate<TAction> } & Mutation<TAction, TOptions>

export type DefinedMutationComposition<
  TAction extends MutationAction,
  TOptions extends MutationOptions<TAction>
> = (options?: TOptions) => { mutate: Mutate<TAction> } & Mutation<TAction, TOptions>

export type DefinedMutation<
  TAction extends MutationAction,
  TOptions extends MutationOptions<TAction>
> = {
  mutate: DefinedMutationFunction<TAction, TOptions>,
  useMutation: DefinedMutationComposition<TAction, TOptions>,
}

export type DefineMutation = <
  const TAction extends MutationAction,
  const TOptions extends MutationOptions<TAction>
>(action: TAction, options?: TOptions) => DefinedMutation<TAction, TOptions>

