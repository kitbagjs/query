import { QueryGroupOptions } from '@/createQueryGroup'

export type ClientOptions = QueryGroupOptions & {
  pauseActionsInBackground?: boolean,
}
