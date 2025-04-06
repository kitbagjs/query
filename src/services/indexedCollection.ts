import { createSequence } from "@/createSequence"

type IndexedCollectionId = number
type CollectionData<TData> = Map<IndexedCollectionId, TData>
type CollectionIndex<TData, TKey extends keyof TData> = Map<TData[TKey], IndexedCollectionId[]>

type IndexedCollection<TData, TKeys extends keyof TData> = {
  addItem: (item: TData) => void
  deleteItem: <TKey extends TKeys>(index: TKey, value: TData[TKey]) => void
  findItem: <TKey extends TKeys>(index: TKey, value?: TData[TKey]) => TData[]
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

  function addItem(item: TData): void {
    const collectionId = getId()
    collectionData.set(collectionId, item)

    indexKeys.forEach(key => {
      if(!indexes[key].has(item[key])) {
        indexes[key].set(item[key], [collectionId])
      } else {
        indexes[key].get(item[key])!.push(collectionId)
      }
    })
  }

  function deleteItem(index: TKeys, value: TData[TKeys]): void {
    const collectionIds = indexes[index].get(value) ?? []

    collectionIds.forEach(collectionId => {
      const item = collectionData.get(collectionId)

      if(!item) {
        return
      }

      indexKeys.forEach(key => {
        indexes[key].delete(item[key])
      })

      collectionData.delete(collectionId)
    })

    indexes[index].delete(value)
  }

  function findItem(index: TKeys, value?: TData[TKeys]): TData[] {
    if(!value) {
      return Array.from(collectionData.values())
    }

    const indexedCollectionIds = indexes[index].get(value) ?? []

    return indexedCollectionIds.map(id => collectionData.get(id)!)
  }

  return {
    addItem,
    deleteItem,
    findItem    
  }
}

function createCollectionIndex<TData, TKey extends keyof TData>(items: CollectionData<TData>, key: TKey): CollectionIndex<TData, TKey> {
  return items.entries().reduce((index, [collectionId, item]) => {
    if(!index.has(item[key])) {
      index.set(item[key], [collectionId])
    } else {
      index.get(item[key])!.push(collectionId)
    }

    return index
  }, new Map<TData[TKey], IndexedCollectionId[]>())
}