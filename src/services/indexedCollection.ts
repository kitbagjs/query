import { createSequence } from "@/createSequence"

type IndexedCollectionId = number
type CollectionData<TData> = Map<IndexedCollectionId, TData>
type CollectionIndex<TData, TKey extends keyof TData> = Map<TData[TKey], Set<IndexedCollectionId>>

type IndexedCollection<TData, TKeys extends keyof TData> = {
  addItem: (item: TData) => void
  deleteItem: <TKey extends TKeys>(index: TKey, value: TData[TKey]) => void
  findItem: <TKey extends TKeys>(index: TKey, value?: TData[TKey]) => TData[]
  clear: () => void
}

const getId = createSequence()

export function createIndexedCollection<const TData, const TKeys extends keyof TData = keyof TData>(items: TData[], indexKeys: TKeys[]): IndexedCollection<TData, TKeys> {
  const collectionData: CollectionData<TData> = new Map(items.map((item) => [
    getId(),
    item
  ]))

  const indexes = indexKeys.reduce((indexes, key) => {
    indexes[key] = createCollectionIndex(collectionData, key)

    return indexes
  }, {} as Record<TKeys, CollectionIndex<TData, TKeys>>)

  const addItem: IndexedCollection<TData, TKeys>['addItem'] = (item): void => {
    const collectionId = getId()
    collectionData.set(collectionId, item)

    indexKeys.forEach(key => {
      if(!indexes[key].has(item[key])) {
        indexes[key].set(item[key], new Set([collectionId]))
      } else {
        indexes[key].get(item[key])!.add(collectionId)
      }
    })
  }

  const deleteItem: IndexedCollection<TData, TKeys>['deleteItem'] = (index, value): void => {
    const collectionIds = indexes[index].get(value) ?? []

    collectionIds.forEach(collectionId => {
      const item = collectionData.get(collectionId)

      if(!item) {
        return
      }

      indexKeys.forEach(key => {
        indexes[key].get(item[key])!.delete(collectionId)

        if (indexes[key].get(item[key])?.size === 0) {
          indexes[key].delete(item[key])
        }
      })

      collectionData.delete(collectionId)
    })
  }

  const findItem: IndexedCollection<TData, TKeys>['findItem'] = (index, value): TData[] => {
    if(!value) {
      return Array.from(collectionData.values())
    }

    return Array
      .from(indexes[index].get(value) ?? [])
      .map(id => collectionData.get(id)!)
  }

  const clear: IndexedCollection<TData, TKeys>['clear'] = (): void => {
    collectionData.clear()

    indexKeys.forEach(key => {
      indexes[key].clear()
    })
  }

  return {
    addItem,
    deleteItem,
    findItem,
    clear
  }
}

function createCollectionIndex<TData, TKey extends keyof TData>(items: CollectionData<TData>, key: TKey): CollectionIndex<TData, TKey> {
  return items.entries().reduce((index, [collectionId, item]) => {
    if(!index.has(item[key])) {
      index.set(item[key], new Set([collectionId]))
    } else {
      index.get(item[key])!.add(collectionId)
    }

    return index
  }, new Map<TData[TKey], Set<IndexedCollectionId>>())
}