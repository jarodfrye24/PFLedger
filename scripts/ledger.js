console.log('Ledger ! Im running!');

//Main class
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

    static get allLedgerEntries()
    {
        const allLedgers = game.users.reduce((accumulator, user) => 
        {
            const userLedgerEntries = this.getLedgerForUser(user.id);
            return{ ...accumulator, ...userLedgerEntries }
        }, {});

        return allLedgers;
    }

    static getUserTotals(userId)
    {
        const ledgerEntries = this.allLedgerEntries();
        var PP = 0;
        var GP = 0;
        var SP = 0;
        var CP = 0;

        for(let index = 0; index < ledgerEntries.length; ++index)
        {
            PP += ledgerEntries[index].PP;
            GP += ledgerEntries[index].GP;
            SP += ledgerEntries[index].SP;
            CP += ledgerEntries[index].CP;
        }

        charName = game.users.current.data.name;

        return '(charName) has PP:' + PP + ' GP:' + GP + ' SP:' + SP + ' CP:' + CP;
    }
}