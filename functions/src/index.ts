import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'

admin.initializeApp()

const { logger } = functions

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
  // const res = await axios.get('https://randomuser.me/api/')
  // const mockData = res.data.results[0]
  // const email = mockData.email
  // const displayName = `${mockData.name.first} ${mockData.name.last}`
  const email = 'a@mywebpage.cool'
  const displayName = 'Some Person'
  const password = 'asdfjkl;'

  const randomNum = Math.floor(Math.random() * 100)
  const photoNum = randomNum < 100 ? randomNum : 99
  const photoURL = `https://randomuser.me/api/portraits/med/women/${photoNum}.jpg`

  const auth = admin.auth()
  const user = await auth.createUser({
    email,
    password,
    displayName,
    photoURL,
    uid: '123456789',
  })

  response.send(user.displayName)
})

const getRandomDog = async () => {
  const res = await axios.get('https://random.dog/woof?filter=mp4,webm')
  return `https://random.dog/${res.data}`
}

export const createUser = functions.auth
  .user()
  .onCreate(async (user, context) => {
    const { displayName, email, uid, photoURL } = user
    const db = admin.database()
    const ref = db.ref(`users/${uid}`)
    await ref.update({
      displayName: displayName ? displayName : 'Nameless Wonder',
      email,
      photoURL: photoURL ? photoURL : await getRandomDog(),
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

export const deleteParty = functions.database
  .ref('parties/{uuid}')
  .onDelete(async (snapshot, context) => {
    const uuid = context.params.uuid
    logger.log('deleting party', uuid)
    const val = await snapshot.val()
    const userIds = Object.keys(val.users)
    logger.log('removing party from users:', userIds)
    const db = admin.database()
    await Promise.all(
      userIds.map(async (userId) => {
        await db.ref(`users/${userId}/parties/${uuid}`).remove()
      })
    )
  })
