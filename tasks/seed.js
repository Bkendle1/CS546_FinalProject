import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import {
    shopData,
    collectionIndexData,
    userData,
    collectionInventoryData
} from "../data/index.js";
import { updateCurrencyCount } from "../helpers.js";

async function main() {
    const db = await dbConnection();
    console.log("Connected to Gacha_Game db:", db.databaseName);

    await db.dropDatabase();
    console.log("Dropped existing database.");

    // create a user account 
    try {
        await userData.register("user1", "test@gmail.com", "ValidPass1!");
        console.log("Test user1 created.");
    } catch {
        console.log("Test user1 already exists.");
    }

    const { userId } = await userData.login("test@gmail.com", "ValidPass1!");
    // Seed currency for test user
    try {
        // using helper to add currency
        await updateCurrencyCount(userId, 1000);
        console.log("Seeded user1 with 1000 in-game currency.");
    } catch (e) {
        console.error("Failed to seed currency for user1: ", e);
    }

    // 1) create characters
    const characters = [
        // character 1
        {
            // id: 
            name: "Koromon",
            rarity: "rare",
            image: "https://media-hosting.imagekit.io/46e9c56391d046d1/koromon.png?Expires=1841612671&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=pttwzQ3X246oNBNK6Ujhx5qgXuMievDCqGeWbsKPWWk5jdApRHGQTqF92WtL7MTQ8YcufxRnghhURyxHkQvU32dkJnPk5iG9dADRMpL7LBXN5MEGLYfrPXyE62sTJMgIM7Zx08XFBQ7DS77pn50DdB6cGHEvnP8GKblIbPbMjpxk5yJRPf63t-VF34Z5ydjlKDoCKLuVdkj1gZoLmWz1jLz4qfwCoCllPQhp~gGoDBUy-ieh2l3cNYyTJlpwEO~miHTKma0ZVbDro3tB~l3C6HTlmvZBd0Jkdm46MRhwyFFBWM8JFs53LPJjo3H-9q~bG4MmQAjUJGc2wEoE3HTcfg__",
            description: "Koromon has shed its fur and grown one size bigger. It can move a bit faster, but fighting is still too much for it. It threatens enemies with bubbles from its mouth.",
        },
        // character 2
        {
            // id 
            name: "Tsunomon",
            rarity: "rare",
            image: "https://media-hosting.imagekit.io/f8665e6bc07a4039/Tsunomon_b.webp?Expires=1841612766&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=xCCK3LQ-r7~xAfUgfv1Yd3b1suSSqzMFW6jkt7QDflEvHXp3EufTV9swDWi40RXyVYluR3S8uwVheWMcDT6xyGGLhRmuAJHhFct8tCYl86t9l7H8FUZgonmweiMYs8dzeEOoHiJNRpe2nb6vv64u9pWJBUhwLv2aw9tzo90DLpWNB5q7lXBYGQlyDSS-xxAeWHNZ1rOu~fs5u9I2CoFfdRhCdyRHt0S3bFP~kjdQsj2LoM4MGdWwL8fSi9NEgVlmkD0lmUwBD0GbrH-SLjK9hrCkiHNUmVCb8wgV~y1SEjPeAj6qDMXaSOEz3UGGWRYFWHJOf7olPiTdrx0QnWWk0w__",
            description: "A small Digimon, but with one of the tentacles on its head hardened. It is covered in tufts of bushy hair. Its playful and mischievous personality remains, but it has yet to awaken to its combat ability.",
        },
        // character 3
        {
            // id 
            name: "Tokomon",
            rarity: "uncommon",
            image: "https://media-hosting.imagekit.io/4bcf6e74a2bc4412/screenshot_1747004812971.png?Expires=1841612813&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=leF0I8D61TkJWy7dGb9wOFYfyDXhB80-lde4yDIon3bh5XOVQeTpCSRhhNFtZGc1m0vjKNKyLximOAAsXzP8R7c4tG0kq3F0FRJj1ffY8iJgX9342OO3L9TCiOHiGXa49dTuU5MlvjYIjmtwclk-fIGdAVfU9v-sZ9Hj9c1Dfddz1aYkpJgGN08FdaJqCojQy5DSNfieuiM366WE4hZmRQEmd1HjTB8T~wPwFVn06UiMrhD1AtGQ9uA-Cf-BPmJMuCCT4lG8ypqAqmEeax4pYRw3ZVEqSA-EHTRamN2qeq0~rGZ3PLUzEI6hP0qmb91EbuHBkSeFuy-upMuo5CE8Mw__",
            description: "A small Digimon with strange appendages growing under its body. Don't let its looks fool you, though; carelessly reach out to it and expect a big set of chompers to clamp down on your hand. That being said, it doesn't have an ounce of ill will in its body.",
        },
        // character 4
        {
            // id 
            name: "Tanemon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/a046a4e342dc4689/screenshot_1747004841138.png?Expires=1841612841&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=xtV34vcNvL7uYqMYL3ruZLrzgS4wzX3mmQIhZIhE2A1XqQYp1ZBhqx7IVLTB6bYX15UNZHD1XMgNFqhZZMJb9ZgTTJ20V4DyU99EQHbyzR8UwtIEyqzUd7DEsi5cmdjMIQZM2j7bR0uANZud63MGarzmY42LnYhXhvxP0WNMHjxFjBPZvPlzc3t4cEfo-Fj6q-qmVYB1nqkMlcBq2324LMzL~L8lZ6cM7SZa3MwmlqUaJO~p71F3O~Vo5kwxFIVcdauvuSthY0DnseZ~WHhB0t-yx~KZ5Xpjf7BrFWdnT4KC3yfSVTIqYl8ITR0NlAPSXs~vJFoRL-VzMBNQ7wM7nQ__",
            description: "A bulb Digimon with sprout-like objects budding from its head. When an enemy draws close, this big old coward digs a hole with its four legs and buries its body in the ground.",
        },
        // character 5
        {
            // id 
            name: "Pagumon",
            rarity: "uncommon",
            image: "https://media-hosting.imagekit.io/6672f0aabc984765/screenshot_1747004856847.png?Expires=1841612857&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=uQ47w55D8bqhNlHsqGWiYz0SnGxkzarfeKefIEPGSuq8e4t1FEnxTKgXi9G4o7mqnwrc870y0eoiBnkR2mZ2qP6h0-8vJ-uOcwaP0UnfwbmuNhyUrSCmfWw-oHHzF1cZDrfG~61pBcXJQADIXwOJDps~7stTTw-sTiQy3KjJz5Yyskbngyq16hK1f6xto3uTqaNiifkL0RPQ2SLIJwBh3TdR1PbOtsBjpVCIALffTVnJP8F60fmzsS3UBuImNNxKjJojVa~5QAT4OlZs1wcYzs4On4CTd9EfBVNQilLwmY3ZTpUmfOF9BKJjT1jiwJcZhcbQSSsjkzaitMA5o7xwSA__",
            description: "This small Digimon can fly at low altitudes with the ear-like protrusions growing out of its head. It can move these ears like a second pair of hands, using them to mock the enemy with all kinds of gestures. It has a malicious streak, often chasing after Digimon and teasing them.",
        },
        // character 6
        {
            // id 
            name: "Motimon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/9d54b15624124a80/screenshot_1747004889553.png?Expires=1841612889&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=nLn4pOTuwpE7oHlaCuCnfet24VW9HNPsp6uYmaA1yGXRfzY5FoV~WHQ5f7okGGOoEiY7mR~OqBFJrtQwsY084q6TOlFWJkYEHeus3satColyDbK--NFShFmYdMhlg1sB4k8rgw32A8rfxyvb0njbTXiu5KqC1-qTt1-3daXsuX8wFqjap0bmOST55kYiDGlx2j2oYcCrW7KmyQ7KLQrHTAHtsqLnFSA~SYDcPVtMLu4TrQBpSvFwJU1mpNUkbeixwmJ7BY7kEaQyYX8anrS~LfrLCEqgXuL8eVTI0B99xhitndCwKYAqEhlkjsnv8yI8ksG0V1e91CO4NushqFL-NA__",
            description: "A soft-bodied Digimon possessing an elastic skin. When it gets worked up, its body swells up like a mochi rice cake. It understands human speech and transforms its body to communicate.",
        },
        // character 7
        {
            // id 
            name: "Bukamon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/8ba0a61905914463/screenshot_1747004910984.png?Expires=1841612911&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=vId4nD7PWv169yZlDUgEHOJ6cxXPLILTIxvCDgn7BhfGTRzVnkVwd-KXE8CTq6BwV3-UWyGcb47p6NPZl0xRrsbHuAVyRv8agp2dcDXUZofF5CR1xM5yIrWtNtOH8XQ6ZHWa-oA-vBiiqhjYdnddf8HYRuuoD-OOjdYiBknqT2OYXjUWHidVXIceHYFP47OUFPygrV6qZXsh8nOUcuJNMXUD7vexOxaDpvBE1MeeuBmxmcNsa2HkEF-b2NSPl7EMUo7c7pL7pxHDPo8vDWrh11BvKb21FR8UZc1FhJFHrJ2boUnyhNjN5FmURlWvxPUXOxAsMf5qt30foMnWUJDySg__",
            description: "This zany Digimon looks like a baby aquatic dinosaur, and moves like a sprightly seahorse. It tends to run away when others get close. Its exodermis can't withstand deep-sea water pressure or low temperatures, so it can't dive in the ocean depths for long.",
        },
        // character 8
        {
            // id 
            name: "Peti Meramon",
            rarity: "uncommon",
            image: "https://media-hosting.imagekit.io/f1ba29ebfb8c44cf/screenshot_1747004934487.png?Expires=1841612934&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=rUu~xDozic7rTojPrEeg5F-ThU8xtvG03ETkft4yEcbWiCBu13daVmKXW7r3v60-8R~dzUlj2-17qSNtYqNVzD02rHXzcSxj5gStKZttRZlVr8ANG7R0im74UMYlcRbJU-dGoAPFYbzvlWmDg-RW7L-rtnA8oPfhQuruTzoKJIl~7UGV28JUNvJyDAIB60mw~MuhuvNGbJ3SovYmAhfo8ePwiUGRoLFEQLinRUc4O7G3YPnXx5peB4gc4wHmTxXypvXlvYBsseZgVe9L~AhmyusCy84V22IRCsdBDCeuai2iRPpq~cTaXdotB9hB9k33Qo8rFpB9J3zAnv9BPysxgw__",
            description: "Its entire body is ablaze due to how its Digicore burns fiercely in the heart of its small body. It has a fierce, aggressive personality atypical of small Digimon, and will spit out small bullets of fire from its mouth to threaten any enemy it encounters.",
        },
        // character 9
        {
            // id 
            name: "Pyocomon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/b25e9eabdb9c41c2/screenshot_1747004959940.png?Expires=1841612960&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=na1J9ePEq6d0X52eRJwIKOyC5C4bKAdYqVCcFI~j9vzUOFpeGKdYPcZiakvSiFyHES~JGb5R4GXK1VJVO6C3EAjaKfDXsCN9KqmYqTgVHxKU~QdQC-QZFJuLgJQXt3jK4jwsQALly7cbu8~O5MpPqbw5YGx8gtfybZ0RWvFDicLkNyVYNasgeJV437XKPD~oVtk~fbs9SC85cBbarp9FS676WfzJN84RbP9PIxCXKQzjDxzjYmt3OOf-oqx4fHR9AZ39D38g20rfM6eShqnSuWeRZ9c-FJyVOPnopLcTAw-cJIvOjaiyOqhoJppMxNICAh~k0p4bWFRVRkI8zf2HIQ__",
            description: "A Bulb-type Digimon with a large flower blooming from its head. It moves skillfully by operating its root-like tentacles and it can rise into the air, but only to a small height. It has a habit of living together in flocks that can grow from a few to a few hundred.",
        },
        // character 10
        {
            // id 
            name: "Kapurimon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/f6222235f9d24243/screenshot_1747004978691.png?Expires=1841612978&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=efykKZ~PkYHJKIFEL6JeZuJt60BcbXrRxNCDmqiiiKkTwYUkQWFlucx5wnuJnr2KADssPzofhgN9faFjZK2fHnVBE8HJpEqRfHjTE9RY3sPCf0RYHuHAl85-qD8z2Gb~~lEZYeHKkn-ZjfLuBmiyhNnKBA6evq18VxHj0dU0ILBZCftxb2cp25XQJOI4YZXJed4eCCW5X44IfXljg9JzwjiSIINtSGf3Q3kluK5zh~3uunqRGfdT2L4uwen8svFniYpiC0VZ1AYcXAOj4IZ5bXDX3HixlCj7kj757NbxzbpmrhBEB8SLJsPz9CQa-pxQq-tyKahKfGXJuiPeyhVX1w__",
            description: "A tiny Digimon wearing a metallic helmet. Within the two horns, it has antennae that are able to receive any radio wave or sound. Kapurimon possess bat-like traits, as it has weak eyesight and produces ultrasonic waves from its mouth, recognizing objects ahead from the rebounding sound wave.",
        },
        // character 11
        {
            // id 
            name: "Nyaromon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/dab0a2c310d749e6/screenshot_1747004996473.png?Expires=1841612996&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=W5ikQCNQ8~yQPnIIr2i9DisLCYwSN5fygoEQPhuWHUaCR34UCfXGLTzrKezGPn1rtnP802xuMJ92FAg0oDcSRv9cC4aXitBj9xVUBVhOy6KtlK3acTnkCJhvpFnSbLVxmbvYajH-Fs5zoqJMeY-AQZ3vQDezN5n08athnHN6SgPbf0dhOUcskwFSV0nY6-9Q1TIJOq~NoLzrWn8Nvk1CcqCVU4~WbLBrUDVH~YTyW-sETrcwsmuPLLqs7VMSyuUf25f42BZ0NqsA7fv~TSDTN1GKps-qHggwwgD3ow85UlQwzw-3C1V75nugzDUOLGqm~8KOaoTBYSlsF0KGHi6ZBg__",
            description: "A small Digimon with feline characteristics. Its capricious, cat-like behavior earned it the name Nyaromon. While both curious and fickle, it has a lonely side to it as well.",
        },
        // character 12
        {
            // id 
            name: "DemiVeemon",
            rarity: "legendary",
            image: "https://media-hosting.imagekit.io/dbae5fcc061f47f8/screenshot_1747005015159.png?Expires=1841613015&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=RVhR7HsL2ctU-F7n4XOjkrWh~H0BfA-vshumqqyB1enSOqB94gDZlLXi191VHyHjRhSU6bPV4SMiTDn7Xa5hzWzD3-jAAWN7eYWVRkdx8g1nLpEvUK7bYZ8Vch-ZNFNVyBJRgBwoX3ncbojfNcpjDbjhcbrrBXb7nrfCroR--ZFOkMUwwFkJDDvFFhVdBWGSOt3ec9gP3a8sV-L-QdVrWk5LOrz1y9XzEgAjvmsSgh5da4tQwzWiwUBGt6A-GnGXvOx8z4-Yj-jCxW-mZLeNcaXhtgWwVQS4vH~QpMfFt8mqpufADi7OztdheirYW~zVTjbpHxZfektJLwQNX7gdvg__",
            description: "Unusually for an In-Training Digimon, it possesses a body, hands, and feet. As it is very voracious, it especially likes sweet foods. Also, as it is very fond of sleeping, if you take your eyes off of it, it will instantly fall asleep.",
        },
        // character 13
        {
            // id 
            name: "Poromon",
            rarity: "Common",
            image: "https://media-hosting.imagekit.io/35dabe43b92b4c3a/screenshot_1747005028874.png?Expires=1841613029&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=DdzK6rS9V~MSA-4mZFwNugDWEF7Un3aty7RaGaTAFgtOeryDEi~6-XeWImPRvvI5I0PKyT-9sgL9yoI4BLLMmgmmqCetEikJ7xAvRYMhto9GEx-xluGmzwDjxAdKsQG-nI0jK3qbV4DHxFEK8O0DdKiVcTsuKX3g6JbXVQE~-NOHZDSrBfN2eLT9liUNpZQ4CItjr3QropsLUe8N6W94TiPWTmS3Y8uzRJjhwI0yZuQhwarD4UKj5THsUWwxWDZqHsm8o2qxJNIU3WwzrWELjXVgv3Lk~YN7rHfYAeS6r-5lbvbxCtvFMOLEEsjdN-f3mjkMSw9dFEW5IX7TKcNlIQ__",
            description: "A Small Bird Digimon that can fly at low altitudes. It has small feathers and wings. Its most charming feature is the feather ornament attached to its head, so it maintains it intently. It has a fundamentally tidy personality, but because it cannot turn its neck(?), it relies on its comrades.",
        },
        // character 14
        {
            // id 
            name: "Upamon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/52696a010ca34c59/screenshot_1747005043267.png?Expires=1841613043&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=AqJJg43mmSrmf-0wsWXQYi8rGJwtvSIGnth0gynStzPZ59g2e1wCZH2n3-WsO6TVq0~51Q6zwsJxKHHlb-f6AVBwwN6CrHPwM7LBrmf95NIMHuk-23utkG9Ypr-8pUSaFRQXBcYwgtNunajAcjt4NgnJEwzUiJLK7WdEg0wudkur~BgCmAjSnFSku3V~i9vSdBNETDnGpDV7PUHl3zWqX7~QWvOTjc7QOKkXLn~aUOS1qB3jud-fFwZ2McwhlH4wKFCc9xU225V~lLtukzZT2OEx~KNdpibkcRQd~QWPRNyi5L~GEIF4EA20L4bBwhHuDOasopN7jBZt9VGjs1XmRg__",
            description: "Upamon is an Amphibian Digimon with ear-like branchia growing from both sides of its head. Although able to live on land or underwater, it is better suited for life on land. Because of its carefree personality, it is frequently bullied by other Digimon, but takes it as being played with.",
        },
        // character 15
        {
            // id 
            name: "Minomon",
            rarity: "common",
            image: "https://media-hosting.imagekit.io/31dd328f80ef45d7/screenshot_1747005065989.png?Expires=1841613066&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=d6ISjmztV9UwIdRSEzElQ9NapgU2AyiDZ05tTuliGatgFO3bLZ3blG2cdyH3F~PvNOsu8SUS7COLS7Qd24NOU8fsi5A7kA6pBqDaCOi136yIeXxUAy4vngNSnfQHZRycABLjwWG~jtSofHeElHiRYxZ4eneNDNPGpSx~HvdwgxyDS3iy4mhLzApzMgbkJV4wbtfCicP-FWhez9Ez2O5X7K3DThbpNRfVYulktz7PlqUD1e37q7us8n5Ma7bC2FtRv6WlZzvkAqOZ6D6R-5sQpisVkeTUwLUDwTA3aJ~J1iJ0N1FFWNQnYNDl0FlWLvclm7LGljEgf9IM7rRdTKNLPA__",
            description: "On days with good weather or when in a good mood, it sticks its face out of its shell. It hangs onto high places and moves by hanging onto large Digimon. Due to its vegetative personality, it has trouble displaying emotion. Its Special Move is throwing a hard, pine cone-shaped substance.",
        },
        // character 16
        {
            // id 
            name: "Gummymon",
            rarity: "uncommon",
            image: "https://media-hosting.imagekit.io/0b48c956c62047ce/screenshot_1747005089338.png?Expires=1841613089&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=YkqCS~-iONJIBM4yzsZ1QiNgByCLrLkeDYvBcoIe6YCF29VdDBRRXCnFm8Wk-WMcZqmq-iqplxixTHmsQcLlsWyoqA-mXfW8U6BQz8OUaM1TvkWNuCI4QzT2xgRVxh~4KoP7TRiIOSW0QG5xO5YJZJxB4zVvwlKSgp9dkvf4FFBCSn5DCu84dlxqk-d9hUlob6~As9aGjv-J0-xBp5IqbkELYhnwq1SRwHXyjBiOAIklnN7iXS8c7~iTmm5xLbxgVt3WQWq6SaSN8vFXYQq7ACjxji21dHk3bFKIaZ55Y79zRYydP1Lwx9bIb0xQbpx8sPXKVRmyPTafYYTTrhSLOw__",
            description: "It has an exceedingly energetic personality, both cheerful and lively. Although it is growing, it's squishy because its body tissue is as unstable as usual but its horn portion is hardened, and it intimidates the opponent with headbutts.",
        },
    ]

    // 2) seed collection index
    console.log("Starting to seed collectionIndex & gacha...");
    try {
        for (const c of characters) {
            await collectionIndexData.addIndexEntry(
                c.name,
                c.rarity,
                c.image,
                c.description
            );
        }
    } catch (e) {
        console.error("error seeding collectionIndex & gacha: ", e);
    }
    console.log("Done seeding collectionIndex & gacha!");

    // 3) create shop items
    const shopItems = [
        {
            name: "normal ticket",
            cost: 10,
            description: "A basic ticket good for one Gacha pull.",
            image: "https://media-hosting.imagekit.io/c7cc679bd0524292/normalTicket.png?Expires=1841701287&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=C7dCrk1pa6RFIDumxnXGqKc6FuvLfu~hWZeQ4yDTGYJDb2k3-rINMsIZjuz1FwN9rFddPFas1oMVUnjKR39ZwvGhlQ6vxMQbTWYfKjEIp4PH7ouDirrNSOWwwwBnCuW8EextqVIOACNVay6W-fb-d7fFaJlilo7ZpIs2IFsGrQAwKH7RQCs6czpJo8Bx8qEyKRS9NQBmueJ0SGAnsdboqvb5~BCs8aWBZVot27S9yrFtO3GsxUoElBYIZH4uNnDFC1FtZyJfP~LHcHczBFHyP27qlkjSDgCwJqJMcUrd8z6jmaV-erARmk3NgDOY5d7FUwCr-UmTMiLKGZY7KIB83w__",
        },
        {
            name: "golden ticket",
            cost: 100,
            description: "A golden ticket with higher odds for rare characters.",
            image: "https://media-hosting.imagekit.io/2996b19575054dd7/goldenTicket.png?Expires=1841701238&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=oL~MzX0ca6NwB1BNrLJxdLo3TUX18y9oJEvQHEjrtov4HEhWihcYZ6gtubkgvR7y8sR2DwslOfXnkTwrd-s1UmCfISzOm0fvBdYZ2vZNa8WmKIbFdL7-JU4LLPnSytcN54byLHSAva0I3eEWHzMlTXM5Ly~C8~wwmrGD1Xb4JSHQB69hKBH9kyvtaWJRFUSJ4ppsQKJ2v~6eKZfudeWd-EW2Iqnr--4u2r9wR3JnQDPNApBCqWF4HkzTE0HI7tzM9D6jVAz1rFs5Zmx9iygPYtmeC0ubT2RfcyT4K5p32Kp-x-4q8-sQzcoF2HbBcjg-lkKQu-xtOw1742COCRQ8gg__",
        },
        {
            name: "food",
            cost: 50,
            description: "Food to feed your characters and boost their experience.",
            image: "https://media-hosting.imagekit.io/fa9b62b8139447b7/screenshot_1747098960528.png?Expires=1841706961&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=XFTAKk5YLA7jXowJR2WqgLBelxkd1xje4Lo20QkSJItBJ5vlpDjaUN4ctBBv6q6yVQ8AkrtGuUsuSL-lSQUIP6ixKrk1rR9S~vwTcHcr03NmM~sSe69lDx4QNgiV4ERcfLAKjiTNY1Ln7axCwL66rPpu1a37mZZ0OgThNnQ5MiDCFqFAMS-ahqn3xbsg1CGmlvBmLIkoyQoemKOP43oSYZC~s-2iGQhTZHgX0mp74kZ23kQhTaniiIfsjfR7p-SX24ZjWeC9vrjf7Ds2m9kABZ5LRVlayCRRdEQ-DuUYzMXlErRmbirk9AY7dG1l3~EdrTFg9shdBftjiq~1p~~Skg__",
        },
    ]

    // 5) seed shop
    console.log("Starting to seed shop collection...");
    try {
        for (const item of shopItems) {
            await shopData.addItemToShop(
                item.name,
                item.cost,
                item.description,
                item.image
            );
        }
    } catch (e) {
        console.error("error seeding shop: ", e);
    }
    console.log("Done seeding shop!");

    console.log("Done seeding all collections!!");
    await closeConnection();
}

main();
