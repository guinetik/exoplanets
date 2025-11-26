import './types';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  query,
  getDocs,
  Timestamp,
  collection,
  where,
  orderBy,
  addDoc,
  Firestore,
} from 'firebase/firestore';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * @class FirebaseData
 * I'm a firebase noob, so I'm collating all related functions is this pseudo-class prototype.
 */
class DBConnection {
  constructor(firebaseConfig) {
    this.firebaseConfig = firebaseConfig;
    /**
     * @type {FirebaseApp}
     */
    this.app = initializeApp(this.firebaseConfig);
    this.auth = getAuth(this.app);
    this.analytics = getAnalytics(this.app);
    /**
     * @type {Firestore}
     */
    this.db = getFirestore(this.app);
    this.googleProvider = new GoogleAuthProvider();
    this.loggedUserContent = null;
    /**
     * Alerts an error to the user.
     * @param {string} error - the error message
     */
    this.errorHandler = (error) => {
      alert(error);
    };
    /**
     * Alerts a message to the user
     * @param {string} message - The message
     */
    this.messageHandler = (message) => {
      alert(message);
    };
  }
  /**
   * Returns a query to the firestore collection with the specified constraints.
   * This query still need to be executed to get the results.
   * @param {CollectionReference} firebaseCollection - a firestore collection
   * @param {QueryConstraint} whereConstraint - a where() constraint
   * @param {QueryConstraint} orderByFunction - an orderBy() constraint (optional)
   * @param {QueryConstraint} limitFunction  - a limit() constraint (optional)
   * @returns {Query} - a firebase query object
   */
  queryDb = (
    firebaseCollection,
    whereConstraint,
    orderByFunction,
    limitFunction
  ) => {
    if (orderByFunction) {
      return query(firebaseCollection, whereConstraint, orderByFunction);
    } else {
      return query(firebaseCollection, whereConstraint);
    }
  };
  /**
   * Adds a new row in a firestore collection
   * @param {CollectionReference} firebaseCollection - a firestore collection
   * @param {Object} data - the data to add as a new row in the collection
   */
  addToCollection = async (firebaseCollection, data) => {
    return addDoc(firebaseCollection, data);
  };
  /**
   * Get a firestore collection by name
   * @param {string} name - The name of the collection to fetch
   * @returns {CollectionReference} - a firestore collection
   */
  getCollection = (name) => {
    return collection(this.db, name);
  };
  /**
   * Gets all items in a firestore collection that matches the specified where constraint.
   * @param {CollectionReference} collectionName - a firestore collection
   * @param {QueryConstraint} whereConstraint - a where() constraint
   * @param {QueryConstraint} orderByFunction - an orderBy() constraint (optional)
   * @param {QueryConstraint} limitFunction  - a limit() constraint (optional)
   * @returns {Promise<QuerySnapshot<T>>} - a Promise with the firebase query snapshot. unwrap with .docs() to get the data
   */
  getCollectionItems = (
    collectionName,
    whereConstraint,
    orderByFunction,
    limitFunction
  ) => {
    return getDocs(
      this.queryDb(
        this.getCollection(collectionName),
        whereConstraint,
        orderByFunction
      )
    );
  };
  /**
   * Returns a list of reviews for a given planet.
   * This method unwraps the firebase collection and returns a pure javascript object.
   * @param {string} planetId - the id of the planet to search for
   * @returns {Promise<Array<PlanetReviews>>} - an array of planet reviews
   */
  getReviews = async (planetId) => {
    //console.log("getReviews", planetId);
    return new Promise(async (resolve, reject) => {
      try {
        const reviews = await this.getCollectionItems(
          'reviews',
          where('planet', '==', planetId),
          orderBy('date', 'desc')
        );
        //console.log("reviews", reviews);
        if (reviews && !reviews.empty) {
          const res = [];
          const authors = {};
          await reviews.docs.forEach(async (snapshot) => {
            //console.log("Review Snapshot:", snapshot);
            const review = snapshot.data();
            review.id = snapshot.id;
            review.date = review.date.toDate();
            const authorId = review.userid;
            if (authors[authorId]) {
              res.user = authors[authorId];
            } else {
              const author = await this.getUserById(authorId);
              //console.log("author", author);
              review.author = authors[authorId] = author;
            }
            res.push(review);
            if (res.length == reviews.docs.length) {
              resolve(res);
            }
          });
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(err);
      }
    });
  };
  createReview = async (userId, planetId, title, body, rating) => {
    /**
     * @type {PlanetReviews}
     */
    const review = {
      date: Timestamp.now(),
      userid: userId,
      planet: planetId,
      title: title,
      text: body,
      rate: rating,
    };
    //console.log("review", review);
    return this.addToCollection(this.getCollection('reviews'), review);
  };
  /**
   * Calls the google auth provider and performs a sign in with popup.
   * If the sign in is successful, adds the user to the database if it doesn't exist.
   */
  signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(this.auth, this.googleProvider);
      const user = res.user;
      const docs = await this.getCollectionItems(
        'users',
        where('uid', '==', user.uid)
      );
      if (docs.docs.length === 0) {
        await this.addToCollection(this.getCollection('users'), {
          uid: user.uid,
          name: user.displayName,
          authProvider: 'google',
          email: user.email,
          avatar: user.photoURL,
        });
      }
      if (this.messageHandler) {
        this.messageHandler('Signed in successfully');
      }
    } catch (err) {
      console.error(err);
      if (this.errorHandler) {
        this.errorHandler(err.message);
      } else {
        alert(err.message);
      }
    }
  };
  /**
   * Fetches user's profile from the database.
   * After the first fetch, it will cache the result in FirebaseData.loggedUserContent
   * @param {string} email - email to search for
   * @returns {FirebaseData.loggedUserContent} - The profile of the logged user
   */
  getLoggedUserByEmail = async (email) => {
    if (email) {
      if (this.loggedUserContent) {
        return this.loggedUserContent;
      }
      const docs = await this.getCollectionItems(
        'users',
        where('email', '==', email)
      );
      if (docs.docs.length === 0) {
        return null;
      } else {
        this.loggedUserContent = docs.docs[0].data();
        return this.loggedUserContent;
      }
    }
    return null;
  };
  /**
   * Fetches user's profile from the database by their uid
   * After the first fetch, it will cache the result in FirebaseData.loggedUserContent
   * @param {string} id - email to search for
   * @returns {User} - The profile of the logged user
   */
  getUserById = async (uid) => {
    if (uid) {
      const docs = await this.getCollectionItems(
        'users',
        where('uid', '==', uid)
      );
      if (docs.empty) {
        return null;
      } else {
        return docs.docs[0].data();
      }
    }
    return null;
  };
  /**
   * Perform a firebase login with email and password.
   * @param {string} email - the user's email
   * @param {string} password  - the user's password
   */
  logInWithEmailAndPassword = async (email, password) => {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (err) {
      console.error(err);
      if (this.errorHandler) {
        this.errorHandler(err.message);
      } else {
        alert(err.message);
      }
    }
  };
  /**
   * Creates a new user in the firesotre db with the specified email and password.
   * @param {string} name - The user's name
   * @param {string} email - The user's email
   * @param {string} password - The user's password
   */
  registerWithEmailAndPassword = async (name, email, password) => {
    try {
      const res = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = res.user;
      this.addToCollection(this.getCollection('users'), {
        uid: user.uid,
        name,
        authProvider: 'local',
        email,
      });
    } catch (err) {
      console.error(err);
      if (this.errorHandler) {
        this.errorHandler(err.message);
      } else {
        alert(err.message);
      }
    }
  };
  /**
   * Sends a password reset email to the specified email.
   * @param {string} email - the user's email
   */
  sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(FirebaseData.auth, email);
      alert('Password reset link sent!');
    } catch (err) {
      console.error(err);
      if (FirebaseData.errorHandler) {
        FirebaseData.errorHandler(err.message);
      } else {
        alert(err.message);
      }
    }
  };
  /**
   * Logs out the user.
   */
  logout = () => {
    this.loggedUserContent = null;
    signOut(this.auth);
  };

  static getInstance(conString) {
    if (!this.instance) {
      this.instance = new DBConnection(conString);
    }

    return this.instance;
  }
}
const FirebaseData = DBConnection.getInstance(firebaseConfig);
export default FirebaseData;
