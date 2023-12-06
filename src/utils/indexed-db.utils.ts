export function createDatabase({ projectId }): Promise<void> {
  console.log("create database")
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId
  const dbVersion = 5 // Increment this version when changes are made to the database structure

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName, dbVersion)

  return new Promise((resolve, reject) => {
    // Handle database upgrade
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        console.log("SUCCESSFULLY CREATED DB, ")
        db.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true
        })
      }
      resolve()
    }

    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      console.log("SUCCESSFUL DB CONNECTION")
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        console.log("SUCCESSFULLY CREATED DB, ")
        db.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true
        })
      }
      resolve()
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

// Save data to IndexedDB
export function saveDataToIndexedDB({
  projectId,
  jobDescriptionId,
  profileId,
  evaluation,
  evaluationRating
}): Promise<void> {
  // console.log("saveDataToIndexedDB")
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId
  const dbVersion = 5 // Increment this version when changes are made to the database structure

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName, dbVersion)

  return new Promise((resolve, reject) => {
    // Handle database upgrade
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        console.log("SUCCESSFULLY CREATED DB")
        db.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true
        })
      }
    }

    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      console.log("SUCCESSFUL DB CONNECTION")
      const db = event.target.result
      const tx = db.transaction(storeName, "readwrite")
      const store = tx.objectStore(storeName)
      const data = {
        projectId,
        jobDescriptionId,
        profileId,
        evaluation,
        evaluationRating
      }

      const addRequest = store.add(data)

      addRequest.onsuccess = () => {
        console.log("Data saved to IndexedDB", data)
        resolve()
      }

      addRequest.onerror = () => {
        console.error("Error saving data to IndexedDB")
        reject()
      }

      // Close the transaction
      tx.oncomplete = () => db.close()
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

export async function deleteDataFromIndexedDB({ id, projectId }) {
  console.log("Delete Data from IndexedDB")
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName)

  return new Promise((resolve, reject) => {
    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      const db = event.target.result
      const tx = db.transaction(storeName, "readwrite")
      console.log("storeName", storeName)
      const store = tx.objectStore(storeName)

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => {
        console.log("Data deleted from IndexedDB: ", id)
        resolve(id)
      }

      deleteRequest.onerror = () => {
        console.error("Error deleting data from IndexedDB")
        reject()
      }

      // Close the transaction
      tx.oncomplete = () => db.close()
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

export async function deleteAllFromIndexedDB({ projectId }) {
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName)

  return new Promise((resolve, reject) => {
    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      try {
        const db = event.target.result
        const tx = db.transaction(storeName, "readwrite")
        console.log("storeName", storeName)
        const store = tx.objectStore(storeName)

        const deleteRequest = store.clear()

        deleteRequest.onsuccess = () => {
          console.log("All Data deleted from IndexedDB: ", projectId)
          resolve(projectId)
        }

        deleteRequest.onerror = () => {
          console.error("Error deleting data from IndexedDB")
          resolve(projectId)
        }

        tx.oncomplete = () => db.close()
      } catch (error) {
        resolve(projectId)
      }
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

export function deleteAllDatabases(): Promise<void> {
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  var request = indexedDB.open(dbName /* version */)

  return new Promise((resolve, reject) => {
    request.onerror = function (event) {
      resolve()
    }

    request.onsuccess = function (event) {
      const db = event.target.result

      // Get a list of existing object stores
      var objectStoreNames = db.objectStoreNames

      // Convert objectStoreNames to an array (since it's a DOMStringList)
      var stores = Array.from(objectStoreNames)

      // Delete each object store
      stores.forEach(function (storeName) {
        db.deleteObjectStore(storeName)
        console.log("Deleted object store: " + storeName)
      })
      resolve()
    }
  })
}

export function getDataFromIndexedDB({
  projectId,
  jobDescriptionId,
  profileId
}) {
  return new Promise((resolve, reject) => {
    const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
    const storeName = projectId

    // Open the database
    const openRequest = indexedDB.open(dbName)

    openRequest.onsuccess = (event) => {
      const db = event.target.result

      try {
        const tx = db.transaction(storeName, "readonly")
        const store = tx.objectStore(storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          const data = request.result
          // Filter the data based on the criteria
          console.log(data)
          const filteredData = data.filter(
            (item) =>
              item.projectId === projectId &&
              item.jobDescriptionId === jobDescriptionId &&
              item.profileId === profileId
          )
          resolve(filteredData)
        }

        request.onerror = () => {
          reject("Error in retrieving data from IndexedDB")
        }
      } catch (error) {
        // Handle case where object store does not exist
        if (error.name === "NotFoundError") {
          console.log("NOT FOUND ERROR")
          resolve(null) // Return null if the store does not exist
        } else {
          reject("Transaction failed", error)
        }
      }
    }

    openRequest.onerror = (event) => {
      reject(`Error opening IndexedDB: ${event.target.errorCode}`)
    }
  })
}
