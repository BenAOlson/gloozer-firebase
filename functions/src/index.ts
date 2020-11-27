import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true })
  response.send('Hello from Firebase!')
})

export const writeData = functions.https.onRequest(
  async (request, response) => {
    // functions.logger.info('Hello logs!', { structuredData: true })

    const db = admin.database()
    const ref = db.ref(`test/testAgain/evenMore`)
    try {
      await ref.set({ ok: true })
    } catch (err) {
      functions.logger.error(err)
    }

    response.send('Alright')
  }
)

export const mockUser = functions.https.onRequest(async (request, response) => {
  const email = 'a@whynotben.com'
  const password = 'sm00thiesORdie1117'

  const auth = admin.auth()
  const user = await auth.createUser({
    email,
    password,
    displayName: 'Ok',
  })

  response.send(user.displayName)
})

export const createUser = functions.auth
  .user()
  .onCreate(async (user, context) => {
    const { displayName, email, uid, photoURL } = user
    const db = admin.database()
    const ref = db.ref(`users/${uid}`)
    ref.set({
      displayName,
      email,
      photoURL,
    })
  })

export const deleteUser = functions.auth
  .user()
  .onDelete(async (user, context) => {
    const { uid } = user
    const db = admin.database()
    const ref = db.ref(`users/${uid}`)
    ref.remove()
  })
