import { dbConnection } from './mongoConnection.js';

// This will allow you to have one reference to each collection per app.
const getCollectionFn = (collection) => {
    let _col = undefined;

    return async () => {
        if (!_col) {
            const db = await dbConnection();
            _col = await db.collection(collection);
        }

        return _col;
    };
};


// LIST YOUR COLLECTIONS HERE
export const gacha = getCollectionFn('gacha');
export const users = getCollectionFn('users');
export const collectionIndex = getCollectionFn('collectionIndex');