import tribalTagList from './tribalTagList.mjs'
import commanderTemplate from './commanderTemplate.mjs'

import axios from 'axios'

const getCommander = async tribe => {
  const url = `https://api.scryfall.com/cards/search?q=otag%3A${tribe}+is%3Acommander&order=edhrec`
  const { data } = await axios.get(url)
  return data.data[0]
}

const getTribalAssets = async (tribe, commander) => {
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=f%3Acommander+otag%3A${tribe}+commander%3A${colorIdentity}&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const getCreatures = async (tribe, commander) => {
  const creatureType = tribe.replace('tribal-', '')
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=t%3A${creatureType}+commander%3A${colorIdentity}+f%3Acommander&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const getOthers = async (tribe, commander) => {
  const creatureType = tribe.replace('tribal-', '')
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=o%3A${creatureType}+-t%3Aland+-t%3Acreature+f%3Acommander+commander%3A${colorIdentity}&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const getStaples = async (tribe, commander) => {
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=-t%3Aland+-t%3Acreature+f%3Acommander+commander%3D${colorIdentity}&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const getTribalLand = async (tribe, commander) => {
  const creatureType = tribe.replace('tribal-', '')
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=o%3A${creatureType}+t%3Aland+f%3Acommander+commander%3D${colorIdentity}&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const getSpecialLand = async (tribe, commander) => {
  const creatureType = tribe.replace('tribal-', '')
  const colorIdentity = commander.color_identity.join('')
  const url = `https://api.scryfall.com/cards/search?q=t%3Aland+f%3Acommander++commander%3D${colorIdentity}&order=edhrec`
  const { data } = await axios.get(url)
  return data.data
}

const makeDeck = async tribe => {
  const deck = new Array()
  const creatureSet = new Set()
  const landSet = new Set()
  const otherSet = new Set()

  const commander = await getCommander(tribe)
  if (!commander) return null
  creatureSet.add(commander.name)

  const tribalAssets = await getTribalAssets(tribe, commander)
  tribalAssets.forEach(asset => {
    if (asset.type_line.toLowerCase().includes('creature')) {
      if (creatureSet.size < commanderTemplate.creature) {
        creatureSet.add(asset.name)
      }
    } else if (asset.type_line.toLowerCase().includes('land')) {
      if (landSet.size < commanderTemplate.land) {
        landSet.add(asset.name)
      }
    } else {
      if (otherSet.size < commanderTemplate.other) {
        otherSet.add(asset.name)
      }
    }
  })

  if (creatureSet.size < commanderTemplate.creature) {
    const creatures = await getCreatures(tribe, commander)
    const creatureDifference = commanderTemplate.creature - creatureSet.size
    const creatureSlice = creatures.slice(0, creatureDifference)
    creatureSlice.forEach(creature => {
      creatureSet.add(creature.name)
    })
  }
  if (otherSet.size < commanderTemplate.other) {
    const others = await getOthers(tribe, commander)
    const otherDifference = commanderTemplate.other - otherSet.size
    const otherSlice = others.slice(0, otherDifference)
    otherSlice.forEach(other => {
      otherSet.add(other.name)
    })
  }

  if (
    creatureSet.size < commanderTemplate.creature ||
    otherSet.size < commanderTemplate.other
  ) {
    const staples = await getStaples(tribe, commander)
    const creatureStapleDifference =
      commanderTemplate.creature - creatureSet.size
    const otherStapleDifference = commanderTemplate.other - otherSet.size
    const creatureStapleSlice = staples.slice(0, creatureStapleDifference)
    const otherStapleSlice = staples.slice(
      creatureStapleDifference,
      otherStapleDifference
    )

    if (creatureSet.size < commanderTemplate.creature) {
      creatureStapleSlice.forEach(staple => {
        creatureSet.add(staple.name)
      })
    }
    if (otherSet.size < commanderTemplate.other) {
      otherStapleSlice.forEach(staple => {
        otherSet.add(staple.name)
      })
    }
  }

  if (landSet.size < commanderTemplate.land) {
    const tribalLands = await getTribalLand(tribe, commander)
    const tribalLandDifference = commanderTemplate.land - landSet.size
    const tribalLandSlice = tribalLands.slice(0, tribalLandDifference)
    tribalLandSlice.forEach(land => {
      landSet.add(land.name)
    })
  }

  if (commander.color_identity.length > 1) {
    if (landSet.size < commanderTemplate.land) {
      const specialLands = await getSpecialLand(tribe, commander)
      const specialLandDifference = commanderTemplate.land - landSet.size
      const specialLandSlice = specialLands.slice(0, specialLandDifference)
      specialLandSlice.forEach(land => {
        landSet.add(land.name)
      })
    }
  }

  creatureSet.delete(commander.name)
  creatureSet.forEach(creature => {
    deck.push(creature)
  })

  landSet.forEach(land => {
    deck.push(land)
  })

  otherSet.forEach(other => {
    deck.push(other)
  })

  let landIterator = 0
  const colors = {
    R: 'Mountain',
    U: 'Island',
    B: 'Swamp',
    W: 'Plains',
    G: 'Forest'
  }
  while (deck.length < 99) {
    let currentColor = commander.color_identity[landIterator]
    deck.push(colors[currentColor])
    landIterator++
    if (landIterator >= commander.color_identity.length) landIterator = 0
  }

  const finalDeck = deck.map(card => `1 ${card}`)
  finalDeck.push('')
  finalDeck.push(`1 ${commander.name}`)
  return finalDeck
}

export default makeDeck
