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

function harvestData(oldD, newD, origin = {})
{
	const ud = {};

	if (!isObjectEmpty(origin)) oldD = mergeObject(origin, oldD, mergeOpts);
	{
        if (newD === undefined || oldD === undefined)
        {
            return ud;
        }
	    newD = duplicate(newD ?? {}), oldD = duplicate(oldD ?? {}); // prevent corrupting original data
    }

	const currency =
    {
		base: newD?.currency ?? {},
		alt: newD?.altCurrency ?? {},
		delta: duplicate(baseC),
	};

	const oldCurrency =
    {
		base: oldD?.currency ?? {},
		alt: oldD?.altCurrency ?? {},
	}

	for (let type of Object.keys(oldCurrency))
    {
		for (let c of currencyTypes)
        {
			if (currency[type][c] !== undefined)
            {
                currency.delta[c] = currency[type][c] - (oldCurrency[type][c] ?? 0);
            }
		}
	}

	return currency;
}

function updateActorEvent(actor, _update, _options, userId)
{
	if (game.user.id !== userId) // Only triggering user should handle things for simplicity
    {
        return;
    }
	// const ud = actor._tempAccountingMonitor;
	// if (ud == undefined) return;
	// delete actor._tempAccountingMonitor;

	// finalizeTransaction(actor, null, ud);
}


Hooks.on('updateActor', updateActorEvent);

Hooks.on('renderActorSheetPF', (actorSheet, html) => {
    const actorDoc = actorSheet.document;
    const user = game.users.get(game.userId);
    const sheetCP = CashConverter.convertToCP(user.data.currency);
    console.log(sheetCP);
});