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
    debugger;
    //get all ledgers in the game
    static get allLegers() {}

    //get ledger for a giver nuser
    static getLedgerForActor(actor)
    {
        return actor.getFlag(Ledger.ID, Ledger.FLAGS.LEDGERS);
    }

    //creates a new entry for the ledger
    static addLedgerEntry(actor, userId, inCurrency, inAltCurrency, inCurrencyDiff, inAltCurrencyDiff, inLedgerLog)
    {
        //generate new random id for this ledger entry and populate the userID
        const actorId = actor.id;
        const newLedgerEntry =
        {
            Log: inLedgerLog,
            currency: inCurrency,
            altCurrency: inAltCurrency,
            currencyDiff: inCurrencyDiff,
            altCurrencyDiff: inAltCurrencyDiff,
            Character: actor.name,
            UserName: game.users.get(userId).name,
            id: foundry.utils.randomID(16),
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
            let actorEntries = new Array();
            for(const ledgerEntry of Object.values(ledgerEntries))
            {
                if(ledgerEntry)
                {
                    if(ledgerEntry.ActorId === actor.id)
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
        let CP = currency.cp;
        CP += currency.sp * 10;
        CP += currency.gp * 100;
        CP += currency.pp * 1000;

        return CP;
    }
    
    static convertToCP(inCP, inSP, inGP, inPP)
    {
        let CP = inCP;
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
        let outLedgers = {ledgers: LedgerData.getLedgerForActor(this.object)};
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
    const altCurrency = actor.system.altCurrency;
    const currency = actor.system.currency;

    const lastEntry = LedgerData.getActorLedgerLastEntry(actor, userId);
    //if the last entry is null, it doesn't exist, so we should make a new entry.
    if(lastEntry === null)
    {
        console.log('Ledger ! No last entry found, creating new entry');
        LedgerData.addLedgerEntry(actor, userId, currency, altCurrency, currency, altCurrency, "Initial entry.");
    }
    else
    {
        //check if there's a delta, if there is we need to create an entry.
        if(!CashConverter.currencyCheck(altCurrency, lastEntry.altCurrency) || !CashConverter.currencyCheck(currency, lastEntry.currency))
        {
            console.log('Ledger ! Changes detected, adding a new entry!');
            const currencyDiff = CashConverter.getCurrencyDelta(currency, lastEntry.currency);
            const altCurrencyDiff = CashConverter.getCurrencyDelta(altCurrency, lastEntry.altCurrency);
            LedgerData.addLedgerEntry(actor, userId, currency, altCurrency, currencyDiff, altCurrencyDiff, description);
        }
    }
}

function getActorLedger_Ext(actor)
{
    let ledgerForm = new LedgerForm(actor).render(true, {actor});
}

function addLedgerButtons(sheet, jq, data)
{
    const actor = data.actor;
    if (!actor || !actor.isOwner)
    {
        return;
    }

    const html = jq[0];
	const tab = html.querySelector('.tab.inventory');
	if (!tab)
    {
        return;
    }

    const currencyTab = tab.querySelector('.currencies');
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
    descriptionBox.setAttribute("value", "");
    descriptionBox.placeholder = "...";
    descriptionBox.title = descBoxTooltip;
    currencyTab.append(descriptionBox);
    descriptionBox.addEventListener("keypress", function(event) {
        if (event.key === "Enter"){
            event.preventDefault();
            updateButton.click();
        }
    })

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

    const deleteLedgerButton = document.createElement("button");
    deleteLedgerButton.classList.add("pfledger-button");
    deleteLedgerButton.textContent = "Delete Ledger";
    deleteLedgerButton.addEventListener("click", event => {
        actor.LedgerData.remove();
    });
    currencyTab.append(deleteLedgerButton);
}

Hooks.on('renderActorSheetPF', addLedgerButtons);


//GM ledger forms.
class ledgerFormGM extends FormApplication
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
        let allLedgers;
        game.actors.forEach(actor =>{
            const currentLedgers = LedgerData.getLedgerForActor(actor);
            if(currentLedgers)
            {
                if(!allLedgers)
                {
                    allLedgers = currentLedgers;
                }
                else
                {
                    allLedgers = {...allLedgers, ...currentLedgers};
                }
            }
        });
        return {ledgers: allLedgers};
    }
}

function getGMLedger_Ext()
{
    let gmLedgerForm = new ledgerFormGM().render(true);
}

function GMLedgerButton(sheet)
{
    if(!game.user.isGM)
    {
        return;
    }

    const openLedgerTooltip = 'Opens the combined player ledgers';
    const ledgerButtonContents = 'Open Ledgers...';

    const pfDetailsTab = sheet.element[0].querySelector('#pf1-details');
    if(!pfDetailsTab || pfDetailsTab.querySelector('#PathfinderGMLedgerButton'))
    {
        return;
    }
    const openGMLedgerButton = document.createElement("button");
    openGMLedgerButton.textContent = ledgerButtonContents;
    openGMLedgerButton.title = openLedgerTooltip;
    openGMLedgerButton.id = "PathfinderGMLedgerButton";
    openGMLedgerButton.addEventListener("click", event =>{
        getGMLedger_Ext();
    })
    pfDetailsTab.append(openGMLedgerButton);
}

Hooks.on('changeSidebarTab', GMLedgerButton);