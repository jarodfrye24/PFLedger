console.log('Ledger ! Im running!');

//Main class
class Ledger
{
    static ID = 'PFLedger';
    static FLAGS = { LEDGERS: 'ledgers' }

    static TEMPLATES = { LEDGERLIST: `modules/${this.ID}/templates/ledger.hbs` }

    static log(force, ...args)
    {  
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
    
        if (shouldLog)
        {
          console.log(this.ID, '|', ...args);
        }
    }
}

//data class
class LedgerData
{
    //get all ledgers in the game
    static get allLegers() {}

    //get ledger for a giver nuser
    static getLedgerForActor(actor)
    {
        return actor.getFlag(Ledger.ID, Ledger.FLAGS.LEDGERS);
    }

    //creates a new entry for the ledger
    static addLedgerEntry(actor, userId, inCurrency, inAltCurrency, inLedgerLog)
    {
        //generate new random id for this ledger entry and populate the userID
        const actorId = actor.id;
        const newLedgerEntry =
        {
            Log: inLedgerLog,
            CP: inCurrency.cp,
            SP: inCurrency.sp,
            GP: inCurrency.gp,
            PP: inCurrency.pp,
            altCP: inAltCurrency.cp,
            altSP: inAltCurrency.sp,
            altGP: inAltCurrency.gp,
            altPP: inAltCurrency.pp,
            Character: actor.name,
            UserName: game.users.get(userId).name,
            ID: foundry.utils.randomID(16),
            ActorId: actorId,
        }

        const newEntries = { [newLedgerEntry.id]: newLedgerEntry }

        return game.actors.get(actorId)?.setFlag(Ledger.ID, Ledger.FLAGS.LEDGERS, newEntries);
    }

    static getActorLedgerLastEntry(actor)
    {
        const ledgerEntries = this.getLedgerForActor(actor);
        if(ledgerEntries)
        {
            var actorEntries = new Array();
            for(const ledgerEntry of Object.values(ledgerEntries))
            {
                if(ledgerEntry)
                {
                    if(ledgerEntry.actorId === actor.data._id)
                    {
                        actorEntries.push(ledgerEntry);
                    }
                }
            }
            if(actorEntries.length > 0)
            {
                return actorEntries[actorEntries.length-1];
            }
        }
        return null;
    }
}

//useful stuff
class CashConverter
{
    static convertCurrencyToCP(currency)
    {
        var CP = currency.cp;
        CP += currency.sp * 10;
        CP += currency.gp * 100;
        CP += currency.pp * 1000;

        return CP;
    }
    
    static convertToCP(inCP, inSP, inGP, inPP)
    {
        var CP = inCP;
        CP += inSP * 10;
        CP += inGP * 100;
        CP += inPP * 1000;

        return CP;
    }

    static currencyCheck(inCurrencyA, inCurrencyB)
    {
        return inCurrencyA.cp == inCurrencyB.cp &&
        inCurrencyA.sp == inCurrencyB.sp &&
        inCurrencyA.gp == inCurrencyB.gp &&
        inCurrencyA.pp == inCurrencyB.pp;
    }

    static getCurrencyDelta(inCurrencyA, inCurrencyB)
    {
        const currency = 
        {
            cp : inCurrencyA.cp - inCurrencyB.cp,
            sp : inCurrencyA.sp - inCurrencyB.sp,
            gp : inCurrencyA.gp - inCurrencyB.gp,
            pp : inCurrencyA.pp - inCurrencyB.pp,
        }

        currency.cp = currency.cp ? currency.cp : 0;
        currency.sp = currency.sp ? currency.sp : 0;
        currency.gp = currency.gp ? currency.gp : 0;
        currency.pp = currency.pp ? currency.pp : 0;

        return currency;
    }
}

//the ledger form
class LedgerForm extends FormApplication
{
    static get defaultOptions()
    {
        const defaults = super.defaultOptions;
      
        const overrides =
        {
          height: '700',
          width: '650',
          id: 'ledger',
          template: Ledger.TEMPLATES.LEDGERLIST,
          title: 'Ledger',
          currencies: ['cp', 'sp', 'gp', 'pp'],
        };
      
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
        
        return mergedOptions;
    }

    getData(options)
    {
        var outLedgers = {ledgers: LedgerData.getLedgerForActor(this.object)};
        return outLedgers;
    }
}

function addLedgerEntry_Ext(actor, description)
{
    //if for any reason actor is null, return early.
    if(actor === null)
    {
        console.log('Ledger ! Actor is null, exiting early');
        return;
    }
    const userId = game.user.id;
    const altCurrency = actor.data.data.altCurrency;
    const currency = actor.data.data.currency;

    const lastEntry = LedgerData.getActorLedgerLastEntry(actor, userId);
    //if the last entry is null, it doesn't exist, so we should make a new entry.
    if(lastEntry === null)
    {
        console.log('Ledger ! No last entry found, creating new entry');
        LedgerData.addLedgerEntry(actor, userId, currency, altCurrency, "Initial entry.");
    }
    else
    {
        //check if there's a delta, if there is we need to create an entry.
        if(!CashConverter.currencyCheck(altCurrency, lastEntry.altCurrency) || !CashConverter.currencyCheck(currency, lastEntry.currency))
        {
            console.log('Ledger ! Changes detected, adding a new entry!');
            const newCurrency = CashConverter.getCurrencyDelta(currency, lastEntry.currency);
            const newAltCurrency = CashConverter.getCurrencyDelta(altCurrency, lastEntry.altCurrency);
            LedgerData.addLedgerEntry(actor, userId, newCurrency, newAltCurrency, description);
        }
    }
}

function getActorLedger_Ext(actor)
{
    var ledgerForm = new LedgerForm(actor).render(true, {actor});
}

function addLedgerButtons(sheet, jq, data)
{
    var actor = data.actor;
    if (!actor)
    {
        return;
    }

    const html = jq[0];
	const tab = html.querySelector('.tab.inventory');
	if (!tab)
    {
        return;
    }

    const currencyTab = tab.querySelector('.inventory-filters');
    if (!currencyTab)
    {
        return;
    }

    const updateTooltip = 'Add ledger entry';
    const openLedgerTooltip = 'Opens the ledger';
    const descBoxTooltip = 'Add ledger entry';
    
    const newRow = document.createElement("flexrow");
    newRow.classList.add("pfledger-spacer");

    const descriptionBox = document.createElement("input");
    descriptionBox.classList.add("pfledger-desc-box");
    descriptionBox.setAttribute("value", "...");
    descriptionBox.title = descBoxTooltip;
    currencyTab.append(descriptionBox);

    const updateButton = document.createElement("button");
    updateButton.classList.add("pfledger-button");
    updateButton.textContent = "Update Ledger";
    updateButton.title = updateTooltip;
    updateButton.addEventListener("click", event => {
        addLedgerEntry_Ext(actor, descriptionBox.value)
    });
    currencyTab.append(updateButton);

    const openLedgerButton = document.createElement("button");
    openLedgerButton.classList.add("pfledger-button");
    openLedgerButton.textContent = "Open Ledger...";
    openLedgerButton.title = openLedgerTooltip;
    openLedgerButton.addEventListener("click", event => {
        getActorLedger_Ext(actor)
    });
    currencyTab.append(openLedgerButton);
}

Hooks.on('renderActorSheetPF', addLedgerButtons);