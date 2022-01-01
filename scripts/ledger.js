console.log('Ledger ! Im running!');

class Ledger
{
    static ID = 'Ledger';
    static FLAGS = { LEDGERS: 'ledgers' }

    static TEMPLATES = { LEDGERLIST: 'modules/${this.ID}/templates/ledgers.hbs' }
}

class LedgerData
{
    //get all ledgers in the game
    static get allLegers() {}

    //get ledger for a giver nuser
    static getLedgerForUser(userID)
    {
        return game.users.get(userId)?.getFlag(Ledger.ID, Ledger.FLAGS.LEDGERS);
    }

    //creates a new entry for the ledger
    static addLedgerEntry(userId, updateData)
    {
        //generate new random id for this ledger entry and populate the userID
        const newLedgerEntry =
        {
            PP: 0,
            GP: 0,
            SP: 0,
            CP: 0,
            id: foundry.utils.randomID(16),
            userId,
        }

        const newEntries = { [newLedgerEntry.id]: newLedgerEntry }

        return game.users.get(userId)?.setFlag(Ledger.id, Ledger.FLAGS.LEDGERS, newEntries);
    }
}