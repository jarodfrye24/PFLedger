console.log('Ledger ! Im running!');

class Ledger
{
    static ID = 'PFLedger';
    static FLAGS = { LEDGERS: 'ledgers' }

    static TEMPLATES = { LEDGERLIST: 'modules/${this.ID}/templates/ledgers.hbs' }

    static log(force, ...args)
    {  
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
    
        if (shouldLog)
        {
          console.log(this.ID, '|', ...args);
        }
    }
}

class LedgerData
{
    //get all ledgers in the game
    static get allLegers() {}

    //get ledger for a giver nuser
    static getLedgerForUser(userId)
    {
        return game.users.get(userId)?.getFlag(Ledger.ID, Ledger.FLAGS.LEDGERS);
    }

    //creates a new entry for the ledger
    static addLedgerEntry(userId, inLedgerLog, inPP, inGP, inSP, inCP)
    {
        //generate new random id for this ledger entry and populate the userID
        const newLedgerEntry =
        {
            ledgerLog: inLedgerLog,
            PP: inPP,
            GP: inGP,
            SP: inSP,
            CP: inCP,
            id: foundry.utils.randomID(16),
            userId,
        }

        const newEntries = { [newLedgerEntry.id]: newLedgerEntry }

        return game.users.get(userId)?.setFlag(Ledger.ID, Ledger.FLAGS.LEDGERS, newEntries);
    }
}