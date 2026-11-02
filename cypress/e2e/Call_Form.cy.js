/// <reference types="cypress" />

/**
 * Staff LMS - Call Form (Call/Visit Form migrated from SOA Excel, columns AH → ED)
 *
 * Reference: "Dev Ticket: Migrate SOA Excel Call/Visit Form → LALCO Staff App"
 *   Section 1   - Customer call            (AH:AY)
 *   Section 2   - Guarantor call           (AZ:BQ)  mirror of section 1
 *   Section 3   - Car collateral check     (BR:BT)
 *   Section 4-5 - Litigation               (BV:CR)  Legal team only
 *   Section 6   - Village master check     (CU:DL)
 *   Section 7   - Agent contact check      (DM:ED)  mirror of section 6
 *
 * Selector notes:
 *   - Every form field gets a unique id: `field-<dot.path>`  e.g. field-customer.call_status
 *     (for dropdowns the id is on the MUI combobox div, for text/date/number it is on the <input>)
 *   - Every section card gets an id: `section-<key>`  e.g. section-village_master
 *   - Section titles may be rendered with or without numbering ("1. Customer call" / "Customer call"),
 *     so titles are matched with an optional numeric prefix.
 */
describe('Staff LMS - Open Call Form', () => {

    // -------------------------------------------------------------------------
    // Dropdown values (verbatim from the dev ticket / GET /api/callFormOptions)
    // -------------------------------------------------------------------------
    const CALL_STATUS_OPTIONS = ['Answered', 'No answer', 'Power off', 'Unreachable', 'Wrong Number'];
    const YES_NO_UNKNOWN = ['NO', 'YES', 'Unknown'];
    const WHO_WILL_PAY_OPTIONS = ['Themselves', 'Family', 'Cousin', 'Others', 'Police'];
    const GPS_OPTIONS = ['Online', 'Offline'];
    const CAR_LOCATION_OPTIONS = [
        'Customer', 'Guarantor', '3rd party', 'Police',
        'Sold by No1 Auto', 'Sold by Customer', 'Repair shop', 'Unknown',
    ];
    const LITIGATION_WITH_OPTIONS = [
        'Both Customer and Guarantor', 'Only Customer', 'Only Guarantor', '3rd Party and Others',
    ];
    const CASE_STAGE_OPTIONS = [
        'village master', 'Prosecutor', 'Police', '1st court', '2nd court', '3rd court', 'judgement fixed',
    ];
    const CASE_TYPE_OPTIONS = ['Normal', 'Special'];
    const LITIGATION_REMARK_OPTIONS = ['car seized and held by police etc', 'customer arrested', 'or other info'];

    const SECTIONS = [
        { key: 'customer', title: 'Customer call' },
        { key: 'guarantor', title: 'Guarantor call' },
        { key: 'car', title: 'Car collateral check' },
        { key: 'litigation', title: 'Litigation' },
        { key: 'village_master', title: 'Village master check' },
        { key: 'agent', title: 'Agent contact check' },
    ];

    const MSG_REQUIRED = 'This field is required.';
    const MSG_NOT_NUMBER = 'Must be a number of 0 or more.';
    const MSG_DATE_PAST = 'Date cannot be in the past.';
    const MSG_INVALID_PHONE = 'Enter a valid phone number';
    const MSG_INVALID_NAME = 'Use Lao or English letters only';

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exact = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`);
    // Matches "Customer call", "1. Customer call", "4–5. Litigation", etc.
    const sectionTitle = (title) => new RegExp(`^\\s*(\\d+(\\s*[–-]\\s*\\d+)?\\.\\s*)?${escapeRegex(title)}\\s*$`, 'i');

    // Get any form field by its dot path
    const field = (path) => cy.get(`[id="field-${path}"]`);
    const fieldSel = (path) => `[id="field-${path}"]`;

    // Helper: scroll table right and click "Open call form" on the first row
    const openCallForm = () => {
        cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
        cy.get('tbody tr').first().find('td').last().within(() => {
            cy.get('a[aria-label="Open call form"]').click();
        });
        cy.url().should('include', '/call-form/');
        // Wait until the form (draft + options) is loaded and section cards are rendered
        cy.get('[id="section-customer"]', { timeout: 60000 }).should('exist');
        cy.url().then((url) => {
            const match = url.match(/call-form\/([^/?#]+)/);
            cy.wrap(match ? decodeURIComponent(match[1]) : '').as('contractNo');
        });
    };

    // Helper: expand a section accordion (only one section is open at a time)
    const openSection = (key) => {
        cy.get(`[id="section-${key}"]`).should('exist').then(($card) => {
            const $collapse = $card.children('.MuiCollapse-root').first();
            if (!$collapse.hasClass('MuiCollapse-entered')) {
                // The first child of the card is the clickable header (title + chips + chevron)
                cy.wrap($card).children().first().scrollIntoView().click();
            }
        });
        cy.get(`[id="section-${key}"]`)
            .children('.MuiCollapse-root')
            .first()
            .should('have.class', 'MuiCollapse-entered');
    };

    const assertSectionCollapsed = (key) => {
        cy.get(`[id="section-${key}"]`)
            .children('.MuiCollapse-root')
            .first()
            .should('not.have.class', 'MuiCollapse-entered');
    };

    // Helper: reset all fields in a section via its "Clear" button so prior saved drafts don't pre-fill fields
    const clearSection = (key) => {
        openSection(key);
        cy.get(`[id="section-${key}"]`).contains('button', /^\s*Clear\s*$/i).scrollIntoView().click();
    };

    // Helper: pick an option in an MUI select by its visible label
    const selectOption = (path, optionText) => {
        field(path).scrollIntoView().click();
        cy.get('ul[role="listbox"]').should('be.visible')
            .contains('li[role="option"]', exact(optionText))
            .click();
        cy.get('ul[role="listbox"]').should('not.exist');
        field(path).should('contain.text', optionText);
    };

    // Helper: pick the first real (non-placeholder) option in an MUI select
    const selectFirstOption = (path) => {
        field(path).scrollIntoView().click();
        cy.get('ul[role="listbox"]').should('be.visible')
            .find('li[role="option"]')
            .not('[data-value=""]')
            .should('have.length.greaterThan', 0)
            .first()
            .click();
        cy.get('ul[role="listbox"]').should('not.exist');
    };

    // Helper: open a dropdown, compare its options (ignoring the "Select" placeholder), then close it
    const assertDropdownOptions = (path, expected) => {
        field(path).scrollIntoView().click();
        cy.get('ul[role="listbox"]').should('be.visible')
            .find('li[role="option"]')
            .should('have.length.greaterThan', 1)
            .then(($lis) => {
                const texts = [...$lis]
                    .map((li) => li.innerText.trim())
                    .filter((t) => t && !/^select$/i.test(t));
                expect(texts).to.deep.equal(expected);
            });
        cy.get('ul[role="listbox"]').type('{esc}');
        cy.get('ul[role="listbox"]').should('not.exist');
    };

    const formControl = (path) => field(path).closest('.MuiFormControl-root');

    const assertRequired = (path) => {
        formControl(path).find('label').should('contain.text', '*');
    };

    const assertFieldError = (path, message) => {
        formControl(path).find('.MuiFormHelperText-root').should('contain.text', message);
    };

    const clickFinalSubmit = () => {
        cy.contains('button', /Final submit/i).scrollIntoView().click();
    };

    // Helper: date string YYYY-MM-DD in LOCAL time, offset by N days
    const formatDate = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    };

    // Helper: build a future date string (tomorrow) in YYYY-MM-DD
    const getFutureDate = () => formatDate(7); // 7 days from now to avoid edge cases

    // Helper: run the body only if the section is editable for the logged-in user
    // (e.g. Litigation is "Legal team only" and renders as "View only" for other roles)
    const ifSectionEditable = (key, probePath, body) => {
        cy.get(`[id="section-${key}"]`).then(($card) => {
            const $probe = $card.find(fieldSel(probePath));
            if (/View only/i.test($card.text()) || $probe.hasClass('Mui-disabled') || $probe.attr('aria-disabled') === 'true') {
                cy.log(`[SKIP] Section "${key}" is view-only for this user.`);
                return;
            }
            body();
        });
    };

    beforeEach(() => {
        // Large viewport so the left "Sections" sidebar (lg breakpoint) is rendered
        cy.viewport(1440, 900);

        // Never allow a real Final submit to reach the backend from these tests
        cy.intercept('POST', '**/api/addCall*', {
            statusCode: 500,
            body: { message: 'Final submit blocked by Cypress test' },
        }).as('addCall');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit('http://54.255.136.172/#/tasks');
        cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    // =========================================================================
    // 1. PAGE LAYOUT & NAVIGATION
    // =========================================================================
    describe('Page Layout & Navigation', () => {

        it('should navigate to the Call Form page from the Tasks table', () => {
            openCallForm();
            cy.contains('h5', 'Customer call').should('be.visible');
        });

        it('should show the contract number in the page header subtitle', () => {
            openCallForm();
            cy.get('@contractNo').then((contractNo) => {
                cy.contains('h5', 'Customer call')
                    .parent()
                    .find('p, span')
                    .first()
                    .should('contain.text', contractNo);
            });
        });

        it('should display all 6 sections in the Call Form sidebar and as accordion cards', () => {
            openCallForm();

            // The section keys rendered via wu map: customer, guarantor, car, litigation, village_master, agent
            // Displayed as accordion card titles (subtitle1 text) and in the left sidebar on large viewports
            const sections = [
                'Customer call',
                'Guarantor call',
                'Car collateral check',
                'Litigation',
                'Village master check',
                'Agent contact check',
            ];

            sections.forEach((section) => {
                cy.contains(section).should('exist');
            });

            // Each section card exists, in the order defined by the dev ticket, with the right title
            cy.get('[id^="section-"]').then(($cards) => {
                const ids = [...$cards].map((c) => c.id);
                expect(ids).to.deep.equal(SECTIONS.map((s) => `section-${s.key}`));
            });
            SECTIONS.forEach(({ key, title }) => {
                cy.get(`[id="section-${key}"]`)
                    .find('.MuiTypography-subtitle1')
                    .first()
                    .invoke('text')
                    .should('match', sectionTitle(title));
            });
        });

        it('should list all sections in the left "Sections" sidebar and open a section when clicked', () => {
            openCallForm();

            cy.contains('.MuiTypography-overline', /^\s*Sections\s*$/i).should('be.visible');

            SECTIONS.forEach(({ title }) => {
                cy.contains('.MuiListItemButton-root', new RegExp(escapeRegex(title), 'i')).should('be.visible');
            });

            // Clicking a sidebar item expands the matching accordion card
            cy.contains('.MuiListItemButton-root', /Car collateral check/i).click();
            cy.get('[id="section-car"]').children('.MuiCollapse-root').first().should('have.class', 'MuiCollapse-entered');
            cy.contains('.MuiListItemButton-root', /Car collateral check/i).should('have.class', 'Mui-selected');
        });

        it('should show a status chip (Not started / Saved / Unsaved changes / View only) on every section', () => {
            openCallForm();
            SECTIONS.forEach(({ key }) => {
                cy.get(`[id="section-${key}"]`)
                    .children()
                    .first()
                    .find('.MuiChip-root')
                    .should('have.length.greaterThan', 0)
                    .invoke('text')
                    .should('match', /Not started|Saved|Unsaved changes|View only|error/i);
            });
        });

        it('should expand only one section at a time (accordion behaviour)', () => {
            openCallForm();

            openSection('customer');
            openSection('car');
            assertSectionCollapsed('customer');

            // Clicking the open section header again collapses it
            cy.get('[id="section-car"]').children().first().click();
            assertSectionCollapsed('car');
        });

        it('should show the Back button and Call history button on the Call Form page', () => {
            openCallForm();
            cy.contains('button', /Back/i).should('be.visible');
            // "Call history" button is labelled via cf_view_history = "Call history"
            cy.contains('button', /Call history/i).should('be.visible');
        });

        it('should open Call History filtered by the current contract when "Call history" is clicked', () => {
            openCallForm();
            cy.get('@contractNo').then((contractNo) => {
                cy.contains('button', /Call history/i).click();
                cy.url().should('include', '/call-history');
                cy.url().should('include', `contract_no=${contractNo}`);
                cy.get('input[placeholder*="2000022"]').should('have.value', contractNo);
            });
        });

        it('should show Cancel and Final submit buttons and section counter at the bottom', () => {
            openCallForm();
            cy.contains('button', /Cancel/i).should('be.visible');
            cy.contains('button', /Final submit/i).should('be.visible');
            // Counter uses pattern: "X / 6 sections saved"
            cy.contains(/\d+\s*\/\s*\d+\s*sections saved/i).should('be.visible');
        });

        it('should navigate back to Tasks page when Back button is clicked', () => {
            openCallForm();
            cy.contains('button', /Back/i).click();
            cy.url().should('include', '/tasks');
        });

        it('should navigate back to Tasks page when Cancel button is clicked', () => {
            openCallForm();
            cy.contains('button', /Cancel/i).click();
            cy.url().should('include', '/tasks');
        });

        it('should keep "Save draft" disabled until a field in the section is changed', () => {
            openCallForm();
            openSection('car');
            cy.get('[id="section-car"]').then(($card) => {
                if (/Unsaved changes/i.test($card.text())) {
                    cy.log('[SKIP] Car section already has unsaved changes.');
                    return;
                }
                cy.wrap($card).contains('button', /Save draft/i).should('be.disabled');

                // Changing a field marks the section dirty and enables Save draft
                cy.get(fieldSel('car.describe_gps')).clear().type('Cypress remark');
                cy.wrap($card).should('contain.text', 'Unsaved changes');
                cy.wrap($card).contains('button', /Save draft/i).should('not.be.disabled');
            });
        });

        it('should open the Edit history dialog for a section that has saved changes', () => {
            openCallForm();
            cy.get('body').then(($body) => {
                const $btn = $body.find('[id^="section-"] button:contains("Edit history")');
                if ($btn.length === 0) {
                    cy.log('[SKIP] No section has edit history yet for this contract.');
                    return;
                }
                const sectionId = $btn.first().closest('[id^="section-"]').attr('id');
                openSection(sectionId.replace('section-', ''));
                cy.get(`[id="${sectionId}"]`).contains('button', /Edit history\s*\(\d+\)/i).click();

                cy.get('[role="dialog"]').should('be.visible').within(() => {
                    cy.contains(/Edit history/i).should('be.visible');
                    cy.contains('button', /Close/i).click();
                });
                cy.get('[role="dialog"]').should('not.exist');
            });
        });
    });

    // =========================================================================
    // 2. SECTION 1 - CUSTOMER CALL (AH:AY)
    // =========================================================================
    describe('Section 1 - Customer call', () => {

        it('should display customer info (Name, Phone, Address) in Section 1', () => {
            openCallForm();
            openSection('customer');
            // Customer info is rendered as plain text fields above the form fields
            cy.get('[id="section-customer"]').within(() => {
                cy.contains('Name').should('be.visible');
                cy.contains('Phone').should('be.visible');
                cy.contains('Address').should('be.visible');
            });
        });

        it('should show Call status as a required field', () => {
            openCallForm();
            openSection('customer');
            // Required asterisk span should be present on the Call status label
            cy.get('[id="field-customer.call_status"]')
                .closest('.MuiFormControl-root')
                .find('label')
                .should('contain.text', '*');
        });

        it('should list all Call status options (AH)', () => {
            openCallForm();
            openSection('customer');
            assertDropdownOptions('customer.call_status', CALL_STATUS_OPTIONS);
        });

        it('should list NO / YES / Unknown in Willing to pay (AI)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            assertDropdownOptions('customer.willing_to_pay', YES_NO_UNKNOWN);
        });

        it('should reveal additional fields when Willing to pay is set to YES', () => {
            openCallForm();
            openSection('customer');

            cy.get('[id="field-customer.call_status"]').click();
            cy.get('[role="listbox"]:visible').contains('Answered').click();

            cy.get('[id="field-customer.willing_to_pay"]').click();
            cy.get('[role="listbox"]:visible').contains('YES').click();

            // Conditional fields rendered inside the payment details outlined box
            // Labels are: "Who will pay", "Date", "Amount", "Source of funds", "Comments" (AJ:AN)
            cy.get('[id="field-customer.who_will_pay"]').should('be.visible');
            cy.get('[id="field-customer.pay_date"]').should('be.visible');
            cy.get('[id="field-customer.pay_amount"]').should('be.visible');
            cy.get('[id="field-customer.source_of_funds"]').should('be.visible');
            cy.get('[id="field-customer.comments"]').should('be.visible');
        });

        it('should mark Who will pay, Date, Amount, Source of funds and Comments as required when YES', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            ['who_will_pay', 'pay_date', 'pay_amount', 'source_of_funds', 'comments'].forEach((f) => {
                assertRequired(`customer.${f}`);
            });
        });

        it('should keep the payment fields hidden when Willing to pay is NO or Unknown', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');

            ['NO', 'Unknown'].forEach((choice) => {
                selectOption('customer.willing_to_pay', choice);
                ['who_will_pay', 'pay_date', 'pay_amount', 'source_of_funds', 'comments'].forEach((f) => {
                    cy.get(fieldSel(`customer.${f}`)).should('not.exist');
                });
            });
        });

        it('should hide and clear the payment fields when Willing to pay changes from YES to NO', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            field('customer.pay_amount').clear().type('750');
            field('customer.source_of_funds').clear().type('Salary');

            selectOption('customer.willing_to_pay', 'NO');
            field('customer.pay_amount').should('not.exist');

            // Re-selecting YES must show the fields again, but empty (values were cleared)
            selectOption('customer.willing_to_pay', 'YES');
            field('customer.pay_amount').should('have.value', '');
            field('customer.source_of_funds').should('have.value', '');
        });

        it('should list all Who will pay options (AJ)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');
            assertDropdownOptions('customer.who_will_pay', WHO_WILL_PAY_OPTIONS);
        });

        it('should render Date as a date picker that does not allow past dates (AM)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            field('customer.pay_date')
                .should('have.attr', 'type', 'date')
                .and('have.attr', 'min', formatDate(0));
        });

        it('should render Amount as a numeric input (AN)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            field('customer.pay_amount')
                .should('have.attr', 'type', 'number')
                .clear()
                .type('1250.50')
                .should('have.value', '1250.50');
        });

        it('should render Source of funds and Comments as free-text inputs (AK, AL)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            field('customer.source_of_funds').clear().type('Rice farm income').should('have.value', 'Rice farm income');
            field('customer.comments').clear().type('Will pay next week').should('have.value', 'Will pay next week');
        });

        it('should fill Section 1 - Customer call with Answered status and YES willing to pay, then save draft', () => {
            openCallForm();
            openSection('customer');

            // Intercept the save draft API call
            cy.intercept('POST', '**/api/callDraft/section').as('saveDraft');

            // Select Call status = Answered
            selectOption('customer.call_status', 'Answered');

            // Select Willing to pay = YES
            selectOption('customer.willing_to_pay', 'YES');

            // Verify YES is selected
            cy.get('[id="field-customer.willing_to_pay"]').should('contain.text', 'YES');

            // Who will pay dropdown — use specific id to avoid matching guarantor section
            selectOption('customer.who_will_pay', 'Themselves');

            // Date field — must be a future date (server validates notPast)
            cy.get('[id="field-customer.pay_date"]').type(getFutureDate());

            // Amount field
            cy.get('[id="field-customer.pay_amount"]').clear().type('500');

            // Currency field (only rendered in builds that have it) - select USD (value 1)
            cy.get('body').then(($body) => {
                if ($body.find(fieldSel('customer.pay_currency')).length) {
                    selectOption('customer.pay_currency', 'USD');
                }
            });

            // Source of funds
            cy.get('[id="field-customer.source_of_funds"]').clear().type('Salary');

            // Comments
            cy.get('[id="field-customer.comments"]').clear().type('Customer agreed to pay.');

            // Click Save draft button scoped to the Customer call section card
            cy.get('[id="section-customer"]').within(() => {
                cy.contains('button', /Save draft/i).click();
            });

            // Wait for the API call to succeed
            cy.wait('@saveDraft').then(({ request, response }) => {
                expect(response.statusCode).to.eq(200);
                expect(request.body.section).to.eq('customer');
                expect(request.body.data.call_status).to.eq('answered');
                expect(request.body.data.willing_to_pay).to.eq('yes');
                expect(request.body.data.who_will_pay).to.eq('themselves');
            });

            // Assert section status chip changes — "Not started" should be gone
            cy.get('[id="section-customer"]').should('not.contain.text', 'Not started');
            cy.get('[id="section-customer"]').should('not.contain.text', 'Unsaved changes');
            cy.get('[id="section-customer"]').contains(/Saved by/i).should('be.visible');
        });
    });

    // =========================================================================
    // 3. ASSET GROUP (AO:AY) - shared by Customer / Guarantor / Village master / Agent
    // =========================================================================
    describe('Asset group (Customer call)', () => {

        it('should display Assets section with Car, Only land, and Land + house dropdowns', () => {
            openCallForm();
            openSection('customer');
            // Assets section is a subtitle2 heading inside the Customer call accordion
            cy.get('[id="section-customer"]').contains('[class*="MuiTypography-subtitle2"]', /Assets/i).should('be.visible');
            cy.get('[id="field-customer.assets.car.has_asset"]').should('exist');
            cy.get('[id="field-customer.assets.land.has_asset"]').should('exist');
            cy.get('[id="field-customer.assets.land_house.has_asset"]').should('exist');
        });

        it('should list NO / YES / Unknown in every asset Have/No dropdown (AO, AR, AV)', () => {
            openCallForm();
            openSection('customer');
            ['car', 'land', 'land_house'].forEach((asset) => {
                assertDropdownOptions(`customer.assets.${asset}.has_asset`, YES_NO_UNKNOWN);
            });
        });

        it('should show Maker – model – year and Value $ only when Car (outside contract) = YES (AP, AQ)', () => {
            openCallForm();
            openSection('customer');

            selectOption('customer.assets.car.has_asset', 'NO');
            field('customer.assets.car.maker_model_year').should('not.exist');
            field('customer.assets.car.value').should('not.exist');

            selectOption('customer.assets.car.has_asset', 'YES');
            field('customer.assets.car.maker_model_year').should('be.visible');
            field('customer.assets.car.value').should('be.visible').and('have.attr', 'type', 'number');
            assertRequired('customer.assets.car.maker_model_year');
            assertRequired('customer.assets.car.value');

            selectOption('customer.assets.car.has_asset', 'Unknown');
            field('customer.assets.car.maker_model_year').should('not.exist');
        });

        it('should show Area, Address and Value only when Only land = YES (AS, AT, AU)', () => {
            openCallForm();
            openSection('customer');

            selectOption('customer.assets.land.has_asset', 'NO');
            field('customer.assets.land.area_m2').should('not.exist');

            selectOption('customer.assets.land.has_asset', 'YES');
            field('customer.assets.land.area_m2').should('be.visible').and('have.attr', 'type', 'number');
            field('customer.assets.land.value').should('be.visible');
            field('customer.assets.land.province_id').should('be.visible');
            field('customer.assets.land.city_id').should('exist');
            field('customer.assets.land.village_id').should('exist');
            assertRequired('customer.assets.land.area_m2');
            assertRequired('customer.assets.land.value');
            assertRequired('customer.assets.land.village_id');
        });

        it('should show Area, Address and Value only when Land + house = YES (AW, AX, AY)', () => {
            openCallForm();
            openSection('customer');

            selectOption('customer.assets.land_house.has_asset', 'Unknown');
            field('customer.assets.land_house.area_m2').should('not.exist');

            selectOption('customer.assets.land_house.has_asset', 'YES');
            field('customer.assets.land_house.area_m2').should('be.visible');
            field('customer.assets.land_house.value').should('be.visible');
            field('customer.assets.land_house.province_id').should('be.visible');
            field('customer.assets.land_house.village_id').should('exist');
        });

        it('should cascade the Address dropdowns (Province → City → Village)', () => {
            openCallForm();
            openSection('customer');
            selectOption('customer.assets.land.has_asset', 'YES');

            // City and Village are disabled until their parent is chosen
            field('customer.assets.land.province_id').then(($prov) => {
                if ($prov.text().trim() && !/select/i.test($prov.text())) {
                    cy.log('[INFO] Province already pre-filled from draft.');
                } else {
                    field('customer.assets.land.city_id').should('have.class', 'Mui-disabled');
                    field('customer.assets.land.village_id').should('have.class', 'Mui-disabled');
                }
            });

            selectFirstOption('customer.assets.land.province_id');
            field('customer.assets.land.city_id').should('not.have.class', 'Mui-disabled');

            selectFirstOption('customer.assets.land.city_id');
            field('customer.assets.land.village_id').should('not.have.class', 'Mui-disabled');
        });
    });

    // =========================================================================
    // 4. SECTION 2 - GUARANTOR CALL (AZ:BQ) - mirror of Section 1
    // =========================================================================
    describe('Section 2 - Guarantor call', () => {

        // Runs the body only if the contract has an active guarantor
        const withGuarantor = (body) => {
            openCallForm();
            openSection('guarantor');
            cy.get('[id="section-guarantor"]').then(($card) => {
                if (/This contract has no active guarantor/i.test($card.text())) {
                    cy.log('[SKIP] Contract has no active guarantor.');
                    return;
                }
                body();
            });
        };

        it('should show the guarantor info (Name, Phone, Relationship with Customer)', () => {
            openCallForm();
            openSection('guarantor');
            cy.get('[id="section-guarantor"]').then(($card) => {
                if (/This contract has no active guarantor/i.test($card.text())) {
                    cy.wrap($card).contains('This contract has no active guarantor.').should('be.visible');
                    return;
                }
                cy.wrap($card).within(() => {
                    cy.contains('Name').should('be.visible');
                    cy.contains('Phone').should('be.visible');
                    cy.contains('Relationship with Customer').should('be.visible');
                });
            });
        });

        it('should show Call status (required) with the same options as Section 1 (AZ)', () => {
            withGuarantor(() => {
                assertRequired('guarantor.call_status');
                assertDropdownOptions('guarantor.call_status', CALL_STATUS_OPTIONS);
            });
        });

        it('should reveal Who will pay, Date, Amount, Source of funds, Comments when Willing to pay = YES (BA:BF)', () => {
            withGuarantor(() => {
                selectOption('guarantor.call_status', 'Answered');

                selectOption('guarantor.willing_to_pay', 'NO');
                field('guarantor.who_will_pay').should('not.exist');

                selectOption('guarantor.willing_to_pay', 'YES');
                ['who_will_pay', 'pay_date', 'pay_amount', 'source_of_funds', 'comments'].forEach((f) => {
                    field(`guarantor.${f}`).should('be.visible');
                    assertRequired(`guarantor.${f}`);
                });
                assertDropdownOptions('guarantor.who_will_pay', WHO_WILL_PAY_OPTIONS);
            });
        });

        it('should render the guarantor Asset group with Car / Only land / Land + house triggers (BG, BJ, BN)', () => {
            withGuarantor(() => {
                cy.get('[id="section-guarantor"]').contains('[class*="MuiTypography-subtitle2"]', /Assets/i).should('be.visible');

                selectOption('guarantor.assets.car.has_asset', 'YES');
                field('guarantor.assets.car.maker_model_year').should('be.visible');
                field('guarantor.assets.car.value').should('be.visible');

                selectOption('guarantor.assets.land.has_asset', 'YES');
                field('guarantor.assets.land.area_m2').should('be.visible');

                selectOption('guarantor.assets.land_house.has_asset', 'YES');
                field('guarantor.assets.land_house.area_m2').should('be.visible');
            });
        });
    });

    // =========================================================================
    // 5. SECTION 3 - CAR COLLATERAL CHECK (BR:BT)
    // =========================================================================
    describe('Section 3 - Car collateral check', () => {

        it('should show the linked car info or a "no car" notice', () => {
            openCallForm();
            openSection('car');
            cy.get('[id="section-car"]').then(($card) => {
                if (/No car is linked to this contract/i.test($card.text())) {
                    cy.wrap($card).contains('No car is linked to this contract.').should('be.visible');
                } else {
                    cy.wrap($card).within(() => {
                        cy.contains(/^\s*Car\s*$/).should('be.visible');
                        cy.contains(/Engine no/i).should('be.visible');
                    });
                }
            });
        });

        it('should show GPS (required) with Online / Offline options (BR)', () => {
            openCallForm();
            openSection('car');
            assertRequired('car.gps_status');
            assertDropdownOptions('car.gps_status', GPS_OPTIONS);
        });

        it('should show Where (car located) (required) with all 8 options (BS)', () => {
            openCallForm();
            openSection('car');
            assertRequired('car.car_location');
            assertDropdownOptions('car.car_location', CAR_LOCATION_OPTIONS);
        });

        it('should show a free-text Remark field (BT) and keep all fields always visible', () => {
            openCallForm();
            openSection('car');

            field('car.describe_gps').clear().type('GPS checked by phone').should('have.value', 'GPS checked by phone');

            // No conditional show/hide inside this block — fields stay visible for every GPS value
            GPS_OPTIONS.forEach((gps) => {
                selectOption('car.gps_status', gps);
                field('car.car_location').should('be.visible');
                field('car.describe_gps').should('be.visible');
            });
        });

        it('should show GPS repair and Exceptional case fields when available in this build', () => {
            openCallForm();
            openSection('car');
            cy.get('[id="section-car"]').then(($card) => {
                if (!/Exceptional case/i.test($card.find('label').text())) {
                    cy.log('[SKIP] GPS repair / Exceptional case fields are not rendered in this build.');
                    return;
                }
                cy.wrap($card).within(() => {
                    cy.contains('label', /GPS repair date/i).should('be.visible');
                    cy.contains('label', /GPS repair place/i).should('be.visible');
                    cy.contains('label', /^\s*Exceptional case/i).should('be.visible');
                    cy.contains('label', /Remarks for exceptional case/i).should('be.visible');
                });
                cy.contains('[id="section-car"] label', /GPS repair date/i)
                    .closest('.MuiFormControl-root')
                    .find('input')
                    .should('have.attr', 'type', 'date');
            });
        });
    });

    // =========================================================================
    // 6. SECTION 4-5 - LITIGATION (BV:CR)
    // =========================================================================
    describe('Section 4-5 - Litigation', () => {

        const customerBlock = ['court_or_police', 'officer_name', 'tel', 'claimed_amount',
            'last_hearing_date', 'next_hearing_date', 'province_id', 'case_stage', 'case_type', 'comments'];

        const openLitigation = (body) => {
            openCallForm();
            openSection('litigation');
            ifSectionEditable('litigation', 'litigation.is_litigation', body);
        };

        it('should show "Is Litigation" (required) with NO / YES / Unknown options (BV)', () => {
            openLitigation(() => {
                assertRequired('litigation.is_litigation');
                assertDropdownOptions('litigation.is_litigation', YES_NO_UNKNOWN);
            });
        });

        it('should hide "Litigation with" unless Is Litigation = YES', () => {
            openLitigation(() => {
                ['NO', 'Unknown'].forEach((choice) => {
                    selectOption('litigation.is_litigation', choice);
                    field('litigation.litigation_with').should('not.exist');
                });

                selectOption('litigation.is_litigation', 'YES');
                field('litigation.litigation_with').should('be.visible');
                assertRequired('litigation.litigation_with');
                assertDropdownOptions('litigation.litigation_with', LITIGATION_WITH_OPTIONS);
            });
        });

        it('should show both Customer and Guarantor litigation blocks for "Both Customer and Guarantor"', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Both Customer and Guarantor');

                cy.get('[id="section-litigation"]').contains(/Customer litigation/i).should('be.visible');
                cy.get('[id="section-litigation"]').contains(/Guarantor litigation/i).should('be.visible');
                customerBlock.forEach((f) => {
                    field(`litigation.customer.${f}`).should('exist');
                    field(`litigation.guarantor.${f}`).should('exist');
                });
                field('litigation.details').should('not.exist');
            });
        });

        it('should show only the Customer litigation block for "Only Customer" (BW:CG)', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Customer');

                field('litigation.customer.court_or_police').should('be.visible');
                field('litigation.guarantor.court_or_police').should('not.exist');
                field('litigation.details').should('not.exist');
            });
        });

        it('should show only the Guarantor litigation block for "Only Guarantor" (CH:CR)', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Guarantor');

                field('litigation.guarantor.court_or_police').should('be.visible');
                field('litigation.customer.court_or_police').should('not.exist');
                field('litigation.details').should('not.exist');
            });
        });

        it('should show only the free-text Details field for "3rd Party and Others"', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', '3rd Party and Others');

                field('litigation.details').should('be.visible').type('Case filed by a 3rd party lender');
                assertRequired('litigation.details');
                field('litigation.customer.court_or_police').should('not.exist');
                field('litigation.guarantor.court_or_police').should('not.exist');
            });
        });

        it('should mark Which court/police, Name, Tel, Last hearing date, Province, State, Case type as required', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Customer');

                ['court_or_police', 'officer_name', 'tel', 'last_hearing_date', 'province_id', 'case_stage', 'case_type']
                    .forEach((f) => assertRequired(`litigation.customer.${f}`));

                field('litigation.customer.claimed_amount').should('have.attr', 'type', 'number');
                field('litigation.customer.last_hearing_date').should('have.attr', 'type', 'date');
                field('litigation.customer.next_hearing_date').should('have.attr', 'type', 'date');
            });
        });

        it('should list all State (case stage) and Normal/Special case options (CD, CE)', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Customer');

                assertDropdownOptions('litigation.customer.case_stage', CASE_STAGE_OPTIONS);
                assertDropdownOptions('litigation.customer.case_type', CASE_TYPE_OPTIONS);
            });
        });

        it('should show Remarks (reason) only when case type = Special (CF)', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Customer');

                selectOption('litigation.customer.case_type', 'Normal');
                field('litigation.customer.remarks_reason').should('not.exist');

                selectOption('litigation.customer.case_type', 'Special');
                field('litigation.customer.remarks_reason').should('be.visible');
                assertDropdownOptions('litigation.customer.remarks_reason', LITIGATION_REMARK_OPTIONS);
            });
        });

        it('should hide "Litigation with" and all blocks again when Is Litigation is changed back to NO', () => {
            openLitigation(() => {
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Both Customer and Guarantor');
                field('litigation.customer.court_or_police').should('be.visible');

                selectOption('litigation.is_litigation', 'NO');
                field('litigation.litigation_with').should('not.exist');
                field('litigation.customer.court_or_police').should('not.exist');
                field('litigation.guarantor.court_or_police').should('not.exist');
            });
        });
    });

    // =========================================================================
    // 7. SECTION 6 & 7 - VILLAGE MASTER CHECK (CU:DL) / AGENT CONTACT CHECK (DM:ED)
    // =========================================================================
    [
        { key: 'village_master', name: 'Section 6 - Village master check', nameLabel: 'Village master name' },
        { key: 'agent', name: 'Section 7 - Agent contact check', nameLabel: 'Agent name' },
    ].forEach(({ key, name, nameLabel }) => {

        describe(name, () => {

            it('should show the optional-section hint and all contact fields', () => {
                openCallForm();
                openSection(key);
                cy.get(`[id="section-${key}"]`).within(() => {
                    cy.contains(/Optional\. If you fill any field here, name, phone and call status become required\./i)
                        .should('be.visible');
                    cy.contains('label', new RegExp(escapeRegex(nameLabel), 'i')).should('be.visible');
                    cy.contains('label', /Phone number/i).should('be.visible');
                    cy.contains('label', /Call status/i).should('be.visible');
                    cy.contains('label', /Relationship with Customer/i).should('be.visible');
                    cy.contains('label', /Customer still living there\?/i).should('be.visible');
                    cy.contains('label', /Customer phone number/i).should('be.visible');
                    cy.contains(/Customer current location/i).should('be.visible');
                });

                ['contact_name', 'contact_phone', 'call_status', 'relationship', 'still_living', 'customer_phone',
                    'location.province_id', 'location.city_id', 'location.village_id'].forEach((f) => {
                    field(`${key}.${f}`).should('exist');
                });
            });

            it('should make Name, Phone number and Call status required once any field is filled', () => {
                openCallForm();
                openSection(key);

                field(`${key}.relationship`).clear().type('Neighbour');

                assertRequired(`${key}.contact_name`);
                assertRequired(`${key}.contact_phone`);
                assertRequired(`${key}.call_status`);
            });

            it('should list the shared Call status options and NO / YES / Unknown for "still living there?"', () => {
                openCallForm();
                openSection(key);
                assertDropdownOptions(`${key}.call_status`, CALL_STATUS_OPTIONS);
                assertDropdownOptions(`${key}.still_living`, YES_NO_UNKNOWN);
            });

            it('should accept free text for Relationship (no dropdown)', () => {
                openCallForm();
                openSection(key);
                field(`${key}.relationship`)
                    .should('match', 'input, textarea')
                    .clear()
                    .type('Village chief')
                    .should('have.value', 'Village chief');
            });

            it('should render its own Asset group with the same show/hide rules', () => {
                openCallForm();
                openSection(key);
                cy.get(`[id="section-${key}"]`).contains('[class*="MuiTypography-subtitle2"]', /Assets/i).should('be.visible');

                selectOption(`${key}.assets.car.has_asset`, 'YES');
                field(`${key}.assets.car.maker_model_year`).should('be.visible');
                field(`${key}.assets.car.value`).should('be.visible');

                selectOption(`${key}.assets.land.has_asset`, 'YES');
                field(`${key}.assets.land.area_m2`).should('be.visible');
                field(`${key}.assets.land.value`).should('be.visible');

                selectOption(`${key}.assets.land_house.has_asset`, 'NO');
                field(`${key}.assets.land_house.area_m2`).should('not.exist');
            });

            it('should reject an invalid phone number and an invalid name on Final submit', () => {
                openCallForm();
                openSection(key);

                field(`${key}.contact_name`).clear().type('Agent 007');
                field(`${key}.contact_phone`).clear().type('12345');
                selectOption(`${key}.call_status`, 'Answered');

                clickFinalSubmit();
                cy.contains(/fields need fixing before you can submit/i).should('be.visible');

                openSection(key);
                assertFieldError(`${key}.contact_phone`, MSG_INVALID_PHONE);
                assertFieldError(`${key}.contact_name`, MSG_INVALID_NAME);

                // Client-side validation must block the request
                cy.get('@addCall.all').should('have.length', 0);
            });
        });
    });

    // =========================================================================
    // 8. VALIDATION & FINAL SUBMIT (client-side; addCall is always stubbed)
    // =========================================================================
    describe('Validation & Final submit', () => {

        it('should block Final submit and list sections with errors when required payment fields are empty', () => {
            openCallForm();
            clearSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            clickFinalSubmit();

            // Error summary banner with one chip per section that has errors
            cy.contains(/\d+\s*fields need fixing before you can submit/i).should('be.visible');
            cy.contains('.MuiAlert-root .MuiChip-root', /Customer call:\s*\d+/i).should('be.visible');

            // Customer section shows an error count chip and the required message under the fields
            cy.get('[id="section-customer"]').children().first().contains(/\d+\s*errors?/i).should('be.visible');
            openSection('customer');
            assertFieldError('customer.who_will_pay', MSG_REQUIRED);
            assertFieldError('customer.pay_amount', MSG_REQUIRED);
            assertFieldError('customer.source_of_funds', MSG_REQUIRED);
            assertFieldError('customer.comments', MSG_REQUIRED);

            cy.get('@addCall.all').should('have.length', 0);
        });

        it('should open the related section when an error chip in the summary banner is clicked', () => {
            openCallForm();
            clearSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');
            clickFinalSubmit();

            openSection('car');
            assertSectionCollapsed('customer');

            cy.contains('.MuiAlert-root .MuiChip-root', /Customer call:\s*\d+/i).click();
            cy.get('[id="section-customer"]').children('.MuiCollapse-root').first().should('have.class', 'MuiCollapse-entered');
        });

        it('should clear a field error as soon as the field is corrected', () => {
            openCallForm();
            clearSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');
            clickFinalSubmit();

            openSection('customer');
            assertFieldError('customer.source_of_funds', MSG_REQUIRED);
            field('customer.source_of_funds').type('Salary');
            formControl('customer.source_of_funds').find('.MuiFormHelperText-root').should('not.contain.text', MSG_REQUIRED);
        });

        it('should reject a negative Amount and a past Date', () => {
            openCallForm();
            clearSection('customer');
            selectOption('customer.call_status', 'Answered');
            selectOption('customer.willing_to_pay', 'YES');

            field('customer.pay_amount').clear().type('-5');
            field('customer.pay_date').clear().type(formatDate(-1));

            clickFinalSubmit();
            openSection('customer');
            assertFieldError('customer.pay_amount', MSG_NOT_NUMBER);
            assertFieldError('customer.pay_date', MSG_DATE_PAST);

            cy.get('@addCall.all').should('have.length', 0);
        });

        it('should require Litigation fields when "Only Customer" is selected and the block is empty', () => {
            openCallForm();
            openSection('litigation');
            ifSectionEditable('litigation', 'litigation.is_litigation', () => {
                clearSection('litigation');
                selectOption('litigation.is_litigation', 'YES');
                selectOption('litigation.litigation_with', 'Only Customer');

                clickFinalSubmit();
                cy.contains(/fields need fixing before you can submit/i).should('be.visible');

                openSection('litigation');
                ['court_or_police', 'officer_name', 'tel', 'last_hearing_date', 'province_id', 'case_stage', 'case_type']
                    .forEach((f) => assertFieldError(`litigation.customer.${f}`, MSG_REQUIRED));

                cy.get('@addCall.all').should('have.length', 0);
            });
        });
    });
});
