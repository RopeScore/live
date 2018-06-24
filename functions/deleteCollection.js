const admin = require('firebase-admin')

exports.deleteCollection = (ref, collectionPath, batchSize) => {
  let collectionRef = ref.collection(collectionPath)
  let query = collectionRef.orderBy('__name__').limit(batchSize)

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, batchSize, resolve, reject)
  })
}

function deleteQueryBatch (query, batchSize, resolve, reject) {
  query.get()
    .then((snapshot) => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0
      }

      // Delete documents in a batch
      let batch = admin.firestore().batch()
      snapshot.docs.forEach((doc) => {
        console.log(doc.id)
        batch.delete(doc.ref)
        doc.ref.getCollections().then(collections => {
          collections.forEach((collection) => {
            console.log(collection.id)
            exports.deleteCollection(collection.parent, collection.id, 25)
          })
        })
      })

      return batch.commit().then(() => {
        return snapshot.size
      })
    }).then((numDeleted) => {
      if (numDeleted === 0) {
        resolve()
        return
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(query, batchSize, resolve, reject)
      })
    })
    .catch(reject)
}
