import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// import axios from 'axios'
// import { randomBytes } from 'crypto'
// import { v4 as uuid } from 'uuid'

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
  const email = 'somebody@mywebpage.cool'
  const displayName = 'Corn Dog'
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

// const getRandomDog = async () => {
//   const res = await axios.get('https://random.dog/woof?filter=mp4,webm')
//   return `https://random.dog/${res.data}`
// }

const getDicebearUrl = (uid: string) =>
  `https://avatars.dicebear.com/4.5/api/avataaars/${uid}.svg?mode=exclude&top[]=longHair&top[]=shortHair&top[]=hijab&top[]=turban&topChance=100&mouth[]=vomit&mouth[]=tongue`

export const createUser = functions.auth
  .user()
  .onCreate(async (user, context) => {
    const { displayName, email, uid, photoURL } = user
    const db = admin.database()
    const ref = db.ref(`users/${uid}`)
    await ref.update({
      displayName: displayName ? displayName : 'Nameless Wonder',
      email,
      // photoURL: photoURL ?? await getRandomDog(),
      photoURL: photoURL ?? getDicebearUrl(uid),
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

export const deleteUserDoc = functions.database
  .ref('users/{uid}')
  .onDelete(async (snapshot, context) => {
    const uid = context.params.uid
    await admin.auth().deleteUser(uid)
  })

export const updatePartyUsers = functions.database
  .ref('parties/{uuid}/users')
  .onUpdate(async (snapshot, context) => {
    const uuid = context.params.uuid
    logger.log('updating user parties', uuid)
    logger.log('context:', context)

    const before = snapshot.before.val() ?? {}
    const after = snapshot.after.val() ?? {}
    const addedUsers = Object.keys(after).filter(function (el) {
      return Object.keys(before).indexOf(el) < 0
    })
    const removedUsers = Object.keys(before).filter(function (el) {
      return Object.keys(after).indexOf(el) < 0
    })
    logger.info('added users', addedUsers)
    logger.info('removed users', removedUsers)

    const db = admin.database()
    await Promise.all(
      removedUsers.map(async (userId) => {
        await db.ref(`users/${userId}/parties/${uuid}`).remove()
      })
    )
    if (addedUsers.length) {
      const partyRef = db.ref(`parties/${uuid}`)
      partyRef.once('value', async (snapshot) => {
        const partyVal = snapshot.val()
        if (partyVal) {
          await Promise.all(
            addedUsers.map(async (userId) => {
              await db.ref(`users/${userId}/parties/${uuid}`).update({
                displayName: partyVal.displayName,
                iconName: partyVal.iconName,
              })
            })
          )
        }
      })
    }
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
