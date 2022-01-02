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
            character: game.users.get(userId).data.name,
            userId,
        }

        const newEntries = { [newLedgerEntry.id]: newLedgerEntry }

        return game.users.get(userId)?.setFlag(Ledger.ID, Ledger.FLAGS.LEDGERS, newEntries);
    }

    static getUserTotals(userId)
    {
        const ledgerEntries = this.getLedgerForUser(userId);
        const charName = game.users.get(userId).data.name;
        var PP = 0;
        var GP = 0;
        var SP = 0;
        var CP = 0;

        for(const ledgerEntry of Object.values(ledgerEntries))
        {
            if(charName === ledgerEntries.character)
            {
                PP += ledgerEntry.PP;
                GP += ledgerEntry.GP;
                SP += ledgerEntry.SP;
                CP += ledgerEntry.CP;
            }
        }

        return charName + ' has PP:' + PP + ' GP:' + GP + ' SP:' + SP + ' CP:' + CP;
    }
}

class CashConverter
{
    static convertToCP(currency)
    {
        var CP = currency.CP;
        CP += currency.SP * 10;
        CP += currency.GP * 100;
        CP += currency.PP * 1000;

        return CP;
    }
}

Hooks.on('renderActorSheetPF', (actorSheet, html) => {
    const sheetCP = CashConverter.convertToCP(game.users.get(userId).data.currency);
    console.log(sheetCP);
});