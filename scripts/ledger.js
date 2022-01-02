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
    static addLedgerEntry(actor, userId, inLedgerLog, inPP, inGP, inSP, inCP)
    {
        //generate new random id for this ledger entry and populate the userID
        const name = actor === null ? game.users.get(userId).data.name : actor.data.name;

        const newLedgerEntry =
        {
            ledgerLog: inLedgerLog,
            PP: inPP,
            GP: inGP,
            SP: inSP,
            CP: inCP,
            id: foundry.utils.randomID(16),
            character: name,
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
        var CP = currency.cp;
        CP += currency.sp * 10;
        CP += currency.gp * 100;
        CP += currency.pp * 1000;

        return CP;
    }
}

function updateActorEvent(actor, _update, _options, userId)
{
	if (game.user.id !== userId) // Only triggering user should handle things for simplicity
    {
        return;
    }

    const altCurrency = actor.data.data.altCurrency;
    const currency = actor.data.data.currency;

    const altCurrencyToCP = CashConverter.convertToCP(altCurrency);
    const currencyToCP = CashConverter.convertToCP(currency);

    console.log('Ledger ! Currency: ' + currencyToCP);
    console.log('Ledger ! WeightlessCurrency: ' + altCurrencyToCP);
}

Hooks.on('updateActor', updateActorEvent);