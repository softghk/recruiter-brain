const storeName = "evaluation"
const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
const dbVersion = 5 // Increment this version when changes are made to the database structure

// Save data to IndexedDB
export function saveDataToIndexedDB({
  projectId,
  jobDescriptionId,
  profileId,
  evaluation,
  evaluationRating
}): Promise<void> {
  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName, dbVersion)

  return new Promise((resolve, reject) => {
    // Handle database upgrade
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true
        })
      }
    }

    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
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
  const openRequest = indexedDB.open(dbName)

  return new Promise((resolve, reject) => {
    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      try {
        const db = event.target.result
        const tx = db.transaction(storeName, "readwrite")
        console.log("storeName", storeName)
        const store = tx.objectStore(storeName)

        const request = store.getAll()

        request.onsuccess = () => {
          const data = request.result
          data
            .filter((item) => item.projectId === projectId)
            .map((item) => store.delete(item.id))
          resolve(projectId)
        }

        request.onerror = () => {
          reject("Error in retrieving data from IndexedDB")
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
          console.log("All Data deleted from IndexedDB")
          resolve()
        }

        deleteRequest.onerror = () => {
          console.error("Error deleting data from IndexedDB")
          resolve()
        }

        tx.oncomplete = () => db.close()
      } catch (error) {
        resolve()
      }
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

export function getDataFromIndexedDB({
  projectId,
  jobDescriptionId,
  profileId
}) {
  return new Promise((resolve, reject) => {
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
