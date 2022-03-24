import makeDeck from './makeDeck.mjs'
import tribalTagList from './tribalTagList.mjs'
import { writeFile } from 'fs/promises'

await Promise.all(
  tribalTagList.map(async tribe => {
    try {
      const deck = await makeDeck(tribe)
      if (deck) {
        await writeFile(`${tribe}.dek`, deck.join('\n'))
      }
    } catch (e) {
      console.error(`Could not complete ${tribe}`)
    }
  })
)
