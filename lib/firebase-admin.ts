import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"

// Product operations
export const productOperations = {
  async getAll() {
    try {
      // Dynamic import to avoid SSR issues
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return []
      }

      const querySnapshot = await getDocs(collection(db, "products"))
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting products:", error)
      return []
    }
  },

  async getById(id: string) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return null
      }

      const docRef = doc(db, "products", id)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
    } catch (error) {
      console.error("Error getting product:", error)
      return null
    }
  },

  async create(product: any) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating product:", error)
      throw error
    }
  },

  async update(id: string, updates: any) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      const docRef = doc(db, "products", id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      await deleteDoc(doc(db, "products", id))
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  },
}

// Order operations
export const orderOperations = {
  async getAll() {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return []
      }

      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting orders:", error)
      return []
    }
  },

  async getByUserId(userId: string) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return []
      }

      const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting user orders:", error)
      return []
    }
  },

  async create(order: any) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      const docRef = await addDoc(collection(db, "orders"), {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      const docRef = doc(db, "orders", id)
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    }
  },
}

// User operations
export const userOperations = {
  async getAll() {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return []
      }

      const querySnapshot = await getDocs(collection(db, "users"))
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  },

  async create(userId: string, userData: any) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        throw new Error("Firestore database not initialized")
      }

      await addDoc(collection(db, "users"), {
        uid: userId,
        ...userData,
        createdAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  },

  async getByUid(uid: string) {
    try {
      const { db } = await import("./firebase")

      if (!db) {
        console.error("Firestore database not initialized")
        return null
      }

      const q = query(collection(db, "users"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.length > 0 ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } : null
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  },
}
