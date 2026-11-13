/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/village-master';
const LIST_API = '/api/village-master_meeting-list';
const SAVE_API = '/api/village-master_meeting-save';
const CONTRACTS_API = '/api/get-contracts';
const STAFF_API = '/api/staff';
const UPLOAD_API = 'https://attache-staging.lalco.la/upload*';
const PAGE_SIZE = 10;

const COLUMNS = [
  'ID',
  'Contract No',
  'Customer',
  'Village Master',
  'Mobile',
  'Meeting Date',
  'Meeting Count',
  'Attended',
  'Created',
  'Actions',
];

const COL = COLUMNS.reduce((acc, name, idx) => ({ ...acc, [name]: idx }), {});

// ---------- Shared Helpers ----------

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`);
const exactCaseInsensitive = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`, 'i');

const interceptList = (alias = 'getVillageVisits', query = null) => {
  if (query) {
    return cy.intercept({ method: 'GET', pathname: LIST_API, query }).as(alias);
  }
  return cy.intercept('GET', `**${LIST_API}*`).as(alias);
};

// Filter bar helpers (filter labels are caption <label> siblings before .MuiFormControl-root)
const filterBox = (labelText) =>
  cy.get('main').contains('label', exact(labelText)).then(($label) => {
    const $nextControl = $label.next('.MuiFormControl-root');
    if ($nextControl.length) return cy.wrap($nextControl);
    return cy.wrap($label.parent());
  });

const filterInput = (labelText) => filterBox(labelText).find('input').first();
const inlineClearBtn = (labelText) => cy.get(`main button[aria-label="Clear ${labelText}"]`);
const clearAllBtn = () => cy.get('main').contains('button', exact('Clear'));
const newVisitBtn = () => cy.get('main').contains('button', exact('New Village Visit'));

// Table & pagination helpers
const tableEl = () => cy.get('main table.MuiTable-root');
const tableRows = () => cy.get('main table.MuiTable-root tbody tr');
const prevPageBtn = () => cy.get('main').contains('button', exact('Previous'));
const nextPageBtn = () => cy.get('main').contains('button', exact('Next'));
const currentPageBtn = () => cy.get('main button[aria-current="page"]');

// Dialog & notification helpers
const dialog = () => cy.get('[role="dialog"]');
const toast = () => cy.get('.Toastify__toast');

/**
 * Resolves a field's .MuiFormControl-root inside the active modal dialog by its label.
 * Always call outside of dialog().within() because cy.get('[role="dialog"]') queries from document root.
 */
const modalField = (labelPattern) =>
  dialog()
    .contains('.MuiFormControl-root > label', labelPattern)
    .closest('.MuiFormControl-root');

const modalInput = (labelPattern) => modalField(labelPattern).find('input').first();
const modalTextarea = (labelPattern) =>
  modalField(labelPattern).find('textarea:not([aria-hidden="true"])').first();
const modalSelect = (labelPattern) =>
  modalField(labelPattern).find('[role="combobox"]').first();

const chooseSelectOption = (optionText) => {
  cy.get('ul[role="listbox"]').should('be.visible').contains('li[role="option"]', exact(optionText)).click();
  cy.get('ul[role="listbox"]').should('not.exist');
};

const assertColumnContains = (colIndex, expected) => {
  tableRows().should(($rows) => {
    expect($rows.length, 'filtered rows count').to.be.greaterThan(0);
    $rows.each((_, row) => {
      const cellText = Cypress.$(row).find('td').eq(colIndex).text().trim();
      expect(cellText.toLowerCase()).to.include(expected.toLowerCase());
    });
  });
};

const pickDynamicRow = (predicate = () => true) =>
  tableRows().should('have.length.greaterThan', 0).then(($rows) => {
    const parsed = [...$rows].map((row, index) => {
      const $tds = Cypress.$(row).find('td');
      return {
        index,
        id: $tds.eq(COL['ID']).text().trim(),
        contractNo: $tds.eq(COL['Contract No']).text().trim(),
        customer: $tds.eq(COL['Customer']).text().trim(),
        villageMaster: $tds.eq(COL['Village Master']).text().trim(),
        mobile: $tds.eq(COL['Mobile']).text().trim(),
        meetingDate: $tds.eq(COL['Meeting Date']).text().trim(),
        meetingCount: $tds.eq(COL['Meeting Count']).text().trim(),
        attended: $tds.eq(COL['Attended']).text().trim(),
        created: $tds.eq(COL['Created']).text().trim(),
      };
    });

    const matches = parsed.filter(predicate);
    expect(matches.length, 'matching table row').to.be.greaterThan(0);
    return matches[0];
  });

const stubUploadSuccess = (fileName = 'mock_doc.pdf', mimeType = 'application/pdf') => {
  cy.intercept('PUT', UPLOAD_API, {
    statusCode: 200,
    body: {
      path: `uploads/${fileName}`,
      bytes: 1024,
      geometry: null,
      signature: 'cypress-mock-signature',
      content_type: mimeType,
    },
  }).as('uploadFile');
};

// =============================================================================
// Test Suite: Staff LMS - Village Master Page
// =============================================================================
describe('Staff LMS - Village Master Page', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    interceptList('getVillageVisits');
    cy.intercept('GET', `**${CONTRACTS_API}*`).as('getContracts');
    cy.intercept('GET', `**${STAFF_API}*`).as('getStaff');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');
    cy.visit(PAGE_URL);

    cy.wait('@getVillageVisits', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
  });

  // ===========================================================================
  // 1. Authentication & Route Navigation
  // ===========================================================================
  describe('1. Authentication & Route Navigation', () => {
    it('should redirect unauthenticated users accessing #/village-master to login', () => {
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.visit(PAGE_URL);

      cy.hash().should('include', 'login');
      cy.get('[name="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should render Village Master page with correct title, URL, and active sidebar item', () => {
      cy.title().should('eq', 'Staff LMS Admin Dashboard');
      cy.url().should('include', '#/village-master');
      cy.get('header .MuiTypography-h6').should('be.visible').and('have.text', 'Village Master');

      cy.get('.MuiDrawer-docked').within(() => {
        cy.contains('.MuiListSubheader-root', exactCaseInsensitive('Operations')).should('be.visible');
        cy.contains('.MuiListItemButton-root.Mui-selected', exact('Village Master')).should('be.visible');
      });
    });

    it('should navigate to Village Master via the sidebar menu under OPERATIONS', () => {
      cy.visit('http://54.255.136.172/#/tasks');
      cy.url().should('include', '#/tasks');

      cy.get('.MuiDrawer-docked')
        .contains('.MuiListItemButton-root', exact('Village Master'))
        .scrollIntoView()
        .click();

      cy.url().should('include', '#/village-master');
      cy.get('header .MuiTypography-h6').should('have.text', 'Village Master');
    });
  });

  // ===========================================================================
  // 2. Layout Shell, Sidebar & Header Controls
  // ===========================================================================
  describe('2. Layout Shell, Sidebar & Header Controls', () => {
    it('should collapse and expand the desktop sidebar drawer', () => {
      cy.get('header button[aria-label="open drawer"]').should('not.be.visible');

      cy.get('.MuiDrawer-docked .MuiDrawer-paper').invoke('outerWidth').should('eq', 240);
      cy.get('.MuiDrawer-docked button[aria-label="Collapse sidebar"]').should('be.visible').click();

      cy.get('.MuiDrawer-docked .MuiDrawer-paper').invoke('outerWidth').should('eq', 80);
      cy.get('.MuiDrawer-docked .MuiListSubheader-root').should('not.exist');
      cy.get('.MuiDrawer-docked button[aria-label="Expand sidebar"]').should('be.visible').click();

      cy.get('.MuiDrawer-docked .MuiDrawer-paper').invoke('outerWidth').should('eq', 240);
      cy.get('.MuiDrawer-docked').contains('.MuiListSubheader-root', exactCaseInsensitive('Operations')).should('be.visible');
    });

    it('should show and toggle the mobile navigation drawer on narrow viewports', () => {
      cy.viewport(375, 812);
      cy.get('header button[aria-label="open drawer"]').should('be.visible').click();

      cy.get('.MuiDrawer-modal').should('be.visible').within(() => {
        cy.contains('.MuiListItemButton-root', exact('Village Master')).should('be.visible');
      });

      cy.get('body').type('{esc}');
      cy.get('.MuiDrawer-modal').should('not.be.visible');
    });

    it('should open and close the Notifications popover from the AppBar', () => {
      cy.get('header button[aria-label="Notifications"]').should('be.visible').click();

      cy.get('.MuiPopover-root').should('be.visible').within(() => {
        cy.contains('Notifications').should('be.visible');
        cy.contains(/\d+\s+unread/i).should('be.visible');
        cy.get('svg[data-testid="RefreshIcon"]').should('be.visible');
        cy.contains('button', exact('View all')).should('be.visible');
      });

      cy.get('body').type('{esc}');
      cy.get('.MuiPopover-root').should('not.exist');
    });

    it('should toggle language between English and Lao and update UI labels and localStorage', () => {
      const langSwitch = 'header div[role="switch"]';

      cy.get(langSwitch)
        .should('be.visible')
        .and('have.attr', 'aria-checked', 'false')
        .and('contain.text', 'EN');

      // Switch to Lao
      cy.get(langSwitch).click();

      cy.get(langSwitch)
        .should('have.attr', 'aria-checked', 'true')
        .and('contain.text', 'ລາວ');
      cy.get('header .MuiTypography-h6').should('have.text', 'ນາຍບ້ານ');
      cy.get('.MuiDrawer-docked').contains('.MuiListSubheader-root', 'ການດຳເນີນງານ').should('be.visible');
      cy.get('main').contains('button', 'ການຢ້ຽມບ້ານໃໝ່').should('be.visible');
      cy.get('main').contains('button', 'ລ້າງຕົວກອງ').should('be.visible');
      cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'lo');

      // Restore English
      cy.get(langSwitch).click();
      cy.get(langSwitch)
        .should('have.attr', 'aria-checked', 'false')
        .and('contain.text', 'EN');
      cy.get('header .MuiTypography-h6').should('have.text', 'Village Master');
      cy.window().its('localStorage').invoke('getItem', 'lalco_lang').should('eq', 'en');
    });

    it('should toggle between Light Mode and Dark Mode and persist preference in localStorage', () => {
      cy.get('header button[aria-label="Dark Mode"]')
        .should('be.visible')
        .find('svg[data-testid="Brightness4Icon"]')
        .should('exist');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('theme-mode')).to.be.oneOf([null, 'false']);
      });

      // Enable Dark Mode
      cy.get('header button[aria-label="Dark Mode"]').click();

      cy.get('header button[aria-label="Light Mode"]')
        .should('be.visible')
        .find('svg[data-testid="Brightness7Icon"]')
        .should('exist');
      cy.get('body').should('have.css', 'background-color', 'rgb(18, 18, 18)');
      cy.window().its('localStorage').invoke('getItem', 'theme-mode').should('eq', 'true');

      // Restore Light Mode
      cy.get('header button[aria-label="Light Mode"]').click();
      cy.get('header button[aria-label="Dark Mode"]').should('be.visible');
      cy.window().its('localStorage').invoke('getItem', 'theme-mode').should('eq', 'false');
    });
  });

  // ===========================================================================
  // 3. Initial Page Rendering, Loading State & Table Structure
  // ===========================================================================
  describe('3. Initial Page Rendering, Loading State & Table Structure', () => {
    it('should show loading spinner while fetching initial data', () => {
      cy.intercept('GET', `**${LIST_API}*`, (req) => {
        req.continue((res) => {
          res.delay = 600;
        });
      }).as('slowList');

      cy.reload();
      cy.get('main .MuiCircularProgress-root[role="progressbar"]').should('be.visible');
      cy.wait('@slowList');
      cy.get('main .MuiCircularProgress-root[role="progressbar"]').should('not.exist');
      tableEl().should('be.visible');
    });

    it('should call village-master_meeting-list with page=1 and page_size=10 on load', () => {
      cy.reload();
      cy.wait('@getVillageVisits').then(({ request, response }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).to.eq('1');
        expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
        expect(response.statusCode).to.eq(200);
      });
    });

    it('should render all 4 filter inputs, Clear button (disabled), and New Village Visit button', () => {
      const filters = [
        { label: 'Contract No', placeholder: 'e.g. 2000022' },
        { label: 'Customer Name', placeholder: 'e.g. Somchai' },
        { label: 'Village Master Name', placeholder: 'e.g. Somchai' },
        { label: 'Mobile', placeholder: 'e.g. 02055551234' },
      ];

      filters.forEach(({ label, placeholder }) => {
        cy.get('main').contains('label', exact(label)).should('be.visible');
        filterBox(label).find('svg[data-testid="SearchIcon"]').should('be.visible');
        filterInput(label)
          .should('be.visible')
          .and('have.attr', 'type', 'text')
          .and('have.attr', 'placeholder', placeholder)
          .and('have.value', '');
        inlineClearBtn(label).should('not.exist');
      });

      clearAllBtn()
        .should('be.visible')
        .and('be.disabled')
        .find('svg[data-testid="RestartAltIcon"]')
        .should('exist');

      newVisitBtn()
        .should('be.visible')
        .and('be.enabled')
        .and('have.class', 'MuiButton-containedPrimary')
        .find('svg[data-testid="AddIcon"]')
        .should('exist');
    });

    it('should render all 10 table column headers in exact order without sort labels', () => {
      cy.get('main table.MuiTable-root thead th')
        .should('have.length', COLUMNS.length)
        .each(($th, idx) => {
          expect($th.text().trim()).to.eq(COLUMNS[idx]);
        });
      cy.get('main table.MuiTable-root thead .MuiTableSortLabel-root').should('not.exist');
    });

    it('should render data rows with formatted cells, Attended chip, and View/Edit row actions', () => {
      tableRows().should(($rows) => {
        expect($rows.length, 'page row count').to.be.within(1, PAGE_SIZE);
        $rows.each((_, row) => {
          const $row = Cypress.$(row);
          const $tds = $row.find('td');
          expect($tds).to.have.length(COLUMNS.length);
          expect($tds.eq(COL['ID']).text()).to.match(/^\s*\d+\s*$/);
          expect($tds.eq(COL['Contract No']).text()).to.match(/^\s*\d+\s*$/);
          expect($tds.eq(COL['Customer']).find('svg[data-testid="PersonIcon"]')).to.have.length(1);
          expect($tds.eq(COL['Meeting Count']).text()).to.match(/^\s*\d+\s*$/);
          expect($tds.eq(COL['Created']).text()).to.match(/[A-Z][a-z]{2}\s+\d{2},\s+\d{4}/);

          const $chip = $tds.eq(COL['Attended']).find('.MuiChip-root.MuiChip-outlined');
          const attendedText = $chip.text().trim();
          expect(attendedText).to.be.oneOf(['Yes', 'No']);
          expect($chip).to.have.class(attendedText === 'Yes' ? 'MuiChip-colorSuccess' : 'MuiChip-colorDefault');

          const $actions = $tds.eq(COL['Actions']);
          expect($actions.find('button')).to.have.length(2);
          expect($actions.find('button[aria-label="View"] svg[data-testid="VisibilityIcon"]')).to.have.length(1);
          expect($actions.find('button[aria-label="Edit"] svg[data-testid="EditIcon"]')).to.have.length(1);
        });
      });
    });
  });

  // ===========================================================================
  // 4. Search, Debounced Filtering & Empty State
  // ===========================================================================
  describe('4. Search, Debounced Filtering & Empty State', () => {
    it('should strip non-numeric characters in Contract No and Mobile inputs', () => {
      filterInput('Contract No').type('abc123!@#45').should('have.value', '12345');
      filterInput('Mobile').type('xyz020$555').should('have.value', '020555');
      clearAllBtn().click();
    });

    it('should filter by Contract No via 300ms debounce and clear via inline X button', () => {
      pickDynamicRow((r) => /^\d+$/.test(r.contractNo)).then(({ contractNo }) => {
        interceptList('filterContract', { contract_no: contractNo });

        filterInput('Contract No').type(contractNo);
        cy.wait('@filterContract', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

        clearAllBtn().should('be.enabled');
        assertColumnContains(COL['Contract No'], contractNo);

        interceptList('resetAfterContract', { page: '1' });
        inlineClearBtn('Contract No').should('be.visible').click();
        cy.wait('@resetAfterContract', { timeout: 15000 });

        filterInput('Contract No').should('have.value', '');
        inlineClearBtn('Contract No').should('not.exist');
        clearAllBtn().should('be.disabled');
      });
    });

    it('should filter by Customer Name and clear via inline X button', () => {
      pickDynamicRow((r) => /[A-Za-z]{3,}/.test(r.customer)).then(({ customer }) => {
        const token = (customer.match(/[A-Za-z]{3,}/g) || [])[0];
        interceptList('filterCustomer', { customer_name: token });

        filterInput('Customer Name').type(token);
        cy.wait('@filterCustomer', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

        assertColumnContains(COL['Customer'], token);

        inlineClearBtn('Customer Name').should('be.visible').click();
        filterInput('Customer Name').should('have.value', '');
        inlineClearBtn('Customer Name').should('not.exist');
      });
    });

    it('should filter by Village Master Name and clear via inline X button', () => {
      pickDynamicRow((r) => r.villageMaster && r.villageMaster !== '-').then(({ villageMaster }) => {
        interceptList('filterVmName', { village_master_name: villageMaster });

        filterInput('Village Master Name').type(villageMaster);
        cy.wait('@filterVmName', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

        assertColumnContains(COL['Village Master'], villageMaster);

        inlineClearBtn('Village Master Name').should('be.visible').click();
        filterInput('Village Master Name').should('have.value', '');
        inlineClearBtn('Village Master Name').should('not.exist');
      });
    });

    it('should filter by Mobile number and clear via inline X button', () => {
      pickDynamicRow((r) => /^\d{6,}$/.test(r.mobile)).then(({ mobile }) => {
        interceptList('filterMobile', { village_master_mobile_number: mobile });

        filterInput('Mobile').type(mobile);
        cy.wait('@filterMobile', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

        assertColumnContains(COL['Mobile'], mobile);

        inlineClearBtn('Mobile').should('be.visible').click();
        filterInput('Mobile').should('have.value', '');
        inlineClearBtn('Mobile').should('not.exist');
      });
    });

    it('should enable global Clear button when filters are set and reset all filters on click', () => {
      filterInput('Contract No').type('2000');
      filterInput('Customer Name').type('Test');
      filterInput('Village Master Name').type('Master');
      filterInput('Mobile').type('020');

      clearAllBtn().should('be.enabled').click();

      filterInput('Contract No').should('have.value', '');
      filterInput('Customer Name').should('have.value', '');
      filterInput('Village Master Name').should('have.value', '');
      filterInput('Mobile').should('have.value', '');
      clearAllBtn().should('be.disabled');
    });

    it('should display the empty state and hide table/pagination when no visits match', () => {
      interceptList('emptySearch', { contract_no: '999999999' });

      filterInput('Contract No').type('999999999');
      cy.wait('@emptySearch', { timeout: 15000 });

      tableEl().should('not.exist');
      prevPageBtn().should('not.exist');
      nextPageBtn().should('not.exist');

      cy.get('main .MuiStack-root').within(() => {
        cy.get('svg[data-testid="GavelIcon"]').should('be.visible');
        cy.contains('h6', exact('No village master visits found')).should('be.visible');
        cy.contains('p', exact('Add a village visit to start tracking these meetings.')).should('be.visible');
      });

      clearAllBtn().click();
      tableEl().should('be.visible');
    });
  });

  // ===========================================================================
  // 5. Pagination Controls
  // ===========================================================================
  describe('5. Pagination Controls', () => {
    it('should disable Previous on page 1 and highlight active page button', () => {
      currentPageBtn().should('be.visible').and('have.text', '1');
      prevPageBtn().should('be.visible').and('be.disabled');
      nextPageBtn().should('be.visible');
    });

    it('should navigate via Next, Previous, and direct page number without altering URL hash', () => {
      nextPageBtn().scrollIntoView().then(($next) => {
        if ($next.is(':disabled')) {
          cy.log('[SKIP] Only 1 page of records exists.');
          return;
        }

        interceptList('getPage2', { page: '2', page_size: String(PAGE_SIZE) });
        cy.wrap($next).click();
        cy.wait('@getPage2', { timeout: 15000 }).its('response.statusCode').should('eq', 200);

        currentPageBtn().should('have.text', '2');
        prevPageBtn().should('be.enabled');
        cy.hash().should('eq', '#/village-master');

        // Navigate back to Page 1 via Previous
        interceptList('getPage1', { page: '1', page_size: String(PAGE_SIZE) });
        prevPageBtn().click();
        cy.wait('@getPage1', { timeout: 15000 });
        currentPageBtn().should('have.text', '1');
        prevPageBtn().should('be.disabled');

        // Navigate directly to the last page button and verify Next becomes disabled
        cy.get('main button')
          .filter((_, btn) => /^\d+$/.test(btn.innerText.trim()))
          .last()
          .then(($lastPageBtn) => {
            const lastPage = $lastPageBtn.text().trim();
            interceptList('getLastPage', { page: lastPage, page_size: String(PAGE_SIZE) });
            cy.wrap($lastPageBtn).click();
            cy.wait('@getLastPage', { timeout: 15000 });

            currentPageBtn().should('have.text', lastPage);
            nextPageBtn().should('be.disabled');
            prevPageBtn().should('be.enabled');
          });
      });
    });

    it('should reset pagination back to page 1 when applying a search filter', () => {
      nextPageBtn().then(($next) => {
        if ($next.is(':disabled')) return;

        interceptList('getPage2', { page: '2' });
        cy.wrap($next).click();
        cy.wait('@getPage2');
        currentPageBtn().should('have.text', '2');

        interceptList('filteredPage1', { page: '1', contract_no: '20' });
        filterInput('Contract No').type('20');
        cy.wait('@filteredPage1', { timeout: 15000 });
        currentPageBtn().should('have.text', '1');
      });
    });
  });

  // ===========================================================================
  // 6. "New Village Visit" Modal — Fields, Branches, Validation & Create
  // ===========================================================================
  describe('6. "New Village Visit" Modal — Fields, Branches, Validation & Create', () => {
    it('should open and close via Cancel, X button, and Escape key', () => {
      newVisitBtn().click();
      dialog().should('be.visible').within(() => {
        cy.contains('h2.MuiDialogTitle-root', exact('New Village Visit')).should('be.visible');
        cy.get('button[aria-label="close"]').should('be.visible');
        cy.contains('button', exact('Cancel')).should('be.visible');
        cy.contains('button', exact('Create')).should('be.visible');
      });

      // Close via Cancel
      dialog().contains('button', exact('Cancel')).click();
      dialog().should('not.exist');

      // Re-open and close via X
      newVisitBtn().click();
      dialog().find('button[aria-label="close"]').click();
      dialog().should('not.exist');

      // Re-open and close via Escape
      newVisitBtn().click();
      dialog().should('be.visible');
      cy.get('body').type('{esc}');
      dialog().should('not.exist');
    });

    it('should display required field validation errors when clicking Create on empty form', () => {
      newVisitBtn().click();
      dialog().contains('button', exact('Create')).click();

      const requiredErrors = [
        'Please select a contract number',
        'Please select a case type',
        'Meeting date is required',
        'Village master name is required',
        'Mobile number is required',
        'Meeting place is required',
        'LALCO visitor is required',
        'Customer Attended is required',
        'Payment status is required',
      ];

      dialog().within(() => {
        requiredErrors.forEach((msg) => {
          cy.contains('p.MuiFormHelperText-root.Mui-error', msg).scrollIntoView().should('be.visible');
        });
      });
    });

    it('should enforce numeric-only 7-15 digit constraint on Village Master Mobile Number', () => {
      newVisitBtn().click();

      modalInput(/Village Master Mobile Number/i)
        .should('have.attr', 'maxlength', '15')
        .and('have.attr', 'inputmode', 'numeric')
        .type('abc020123456789012345')
        .should('have.value', '020123456789012');

      // Short (< 7 digits) triggers mobile validation error on Create
      modalInput(/Village Master Mobile Number/i).clear().type('02012');
      dialog().contains('button', exact('Create')).click();
      dialog().contains('p.MuiFormHelperText-root.Mui-error', /7.*15|valid|mobile/i).should('be.visible');
    });

    it('should enforce >= 2 characters on Contract & Staff autocompletes and auto-populate fields on contract selection', () => {
      newVisitBtn().click();

      // Contract autocomplete: < 2 chars shows helper text and fires no API call
      dialog().find('input[placeholder="Search by contract number"]').type('2');
      cy.get('.MuiAutocomplete-noOptions').should('contain.text', 'Type at least 2 characters to search');
      cy.get('@getContracts.all').should('have.length', 0);

      // >= 2 chars calls /api/get-contracts
      dialog().find('input[placeholder="Search by contract number"]').type('0');
      cy.wait('@getContracts', { timeout: 15000 }).then(({ request, response }) => {
        expect(request.url).to.include('search=20');
        expect(response.statusCode).to.eq(200);
      });

      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      // Customer Name readonly field appears; Meeting Count & Collateral Details auto-populate
      modalInput(/^Customer Name$/i).should('be.visible').and('not.have.value', '').and('have.attr', 'readonly');
      modalInput(/^Meeting Count$/i).should('be.disabled').invoke('val').should('match', /^\d+$/);
      modalTextarea(/^Collateral Details$/i).should('be.visible');

      // LALCO Visitor autocomplete: < 2 chars prompt, >= 2 chars calls /api/staff
      modalInput(/LALCO Visitor/i).scrollIntoView().type('a');
      cy.get('.MuiAutocomplete-noOptions').should('contain.text', 'Type at least 2 characters to search');
      modalInput(/LALCO Visitor/i).type('n');
      cy.wait('@getStaff', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();
    });

    it('should show Next Meeting Date and hide Payment/Collateral/Legal when Customer Attended is No and Meeting Count < 3', () => {
      const todayUTC = new Date().toISOString().split('T')[0];

      cy.intercept('GET', `**${CONTRACTS_API}*`, {
        statusCode: 200,
        body: {
          total: 1,
          total_pages: 1,
          current_page: 1,
          data: [
            {
              id: 9999,
              contract_no: '2099999',
              customer_name: 'Mock Customer One',
              customer_lao_name: '',
              collaterals: [
                {
                  lms_asset_id: '99999',
                  car_make: 'HONDA',
                  car_model: 'WAVE',
                  engine_no: '12345',
                  vin_code: 'VIN12345',
                  gps_imei: '',
                },
              ],
              village_master_meeting_data: {
                village_master_name: 'Mock Master',
                village_master_mobile_number: '02055551111',
                meeting_place: 'Village Office',
                meeting_count: '1',
              },
            },
          ],
        },
      }).as('mockContractLowCount');

      newVisitBtn().click();
      dialog().find('input[placeholder="Search by contract number"]').type('20');
      cy.wait('@mockContractLowCount');
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('No');

      modalInput(/Next Meeting Date/i)
        .scrollIntoView()
        .should('be.visible')
        .and('have.attr', 'type', 'date')
        .and('have.attr', 'min', todayUTC);

      dialog().contains('h6', exact('Payment')).should('not.exist');
      dialog().contains('h6', exact('Collateral')).should('not.exist');
      dialog().contains('h6', exact('Legal Action')).should('not.exist');
      dialog().contains('h6', exact('Hearing / Follow-up')).should('not.exist');

      dialog().contains('button', exact('Create')).click();
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Next meeting date is required').should('be.visible');
    });

    it('should render Payment Date, Payment Method, and Document Upload (with upload/remove) when Customer Agrees to Pay is Yes', () => {
      stubUploadSuccess('agreement.pdf', 'application/pdf');
      newVisitBtn().click();

      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('Yes');

      modalSelect(/Customer Agrees to Pay/i).scrollIntoView().click();
      chooseSelectOption('Yes');

      modalInput(/Payment Date/i).scrollIntoView().should('be.visible').and('have.attr', 'type', 'date');
      modalSelect(/Payment Method/i).should('be.visible').and('contain.text', 'Select payment method');
      dialog().contains('No file selected').should('be.visible');

      // Trigger validation on Payment branch
      dialog().contains('button', exact('Create')).click();
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Payment date is required').should('be.visible');
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Please select a payment method').should('be.visible');
      dialog().contains('span.MuiTypography-caption', 'MOU/Payment document is required').should('be.visible');

      // Check Payment Method options
      modalSelect(/Payment Method/i).click();
      cy.get('ul[role="listbox"]').should('be.visible').within(() => {
        cy.get('li[role="option"][data-value="1"]').should('contain.text', 'MOU');
        cy.get('li[role="option"][data-value="2"]').should('contain.text', 'Payment');
      });
      chooseSelectOption('MOU');

      // Upload a file via unrestricted file input and verify Remove file
      dialog().find('input[type="file"]:not([accept])').first().selectFile(
        {
          contents: Cypress.Buffer.from('mock pdf bytes'),
          fileName: 'agreement.pdf',
          mimeType: 'application/pdf',
        },
        { force: true }
      );
      cy.wait('@uploadFile').its('request.url').should('include', 'file=agreement.pdf');

      dialog().within(() => {
        cy.contains('agreement.pdf').should('be.visible');
        cy.contains('No file selected').should('not.exist');
        cy.get('button[aria-label="Remove file"]').should('be.visible').click();
        cy.contains('agreement.pdf').should('not.exist');
        cy.contains('No file selected').should('be.visible');
      });
    });

    it('should render Legal Action, Civil/Criminal sections, and Hearing/Follow-up when Customer Agrees to Pay is No', () => {
      newVisitBtn().click();

      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('Yes');

      modalSelect(/Customer Agrees to Pay/i).scrollIntoView().click();
      chooseSelectOption('No');

      dialog().contains('label', /Additional Assets \*/i).scrollIntoView().should('be.visible');
      dialog().contains('h6', exact('Legal Action')).scrollIntoView().should('be.visible');
      modalSelect(/File the cases/i).should('contain.text', 'No');

      dialog().contains('h6', exact('Hearing / Follow-up')).scrollIntoView().should('be.visible');
      modalInput(/Hearing \/ Next Meeting Date/i).should('be.visible').and('have.attr', 'type', 'date');
      modalInput(/LALCO Attendee/i).should('be.visible').and('have.attr', 'placeholder', 'Search by staff name');
      modalTextarea(/Case Result/i).should('be.visible');

      // Validate required errors in Pay=No branch
      dialog().contains('button', exact('Create')).click();
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Additional assets is required').should('be.visible');
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Hearing date is required').should('be.visible');
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'LALCO attendee is required').should('be.visible');

      // Set Case Type = Criminal -> File the cases = Yes shows "Police Complaint"
      modalSelect(/Case Type/i).scrollIntoView().click();
      chooseSelectOption('Criminal');

      modalSelect(/File the cases/i).scrollIntoView().click();
      chooseSelectOption('Yes');

      dialog().contains('h6', exact('Police Complaint')).scrollIntoView().should('be.visible');
      modalInput(/Action Date/i).should('be.visible').and('have.attr', 'type', 'date');
      dialog().contains('No file selected').should('be.visible');

      dialog().contains('button', exact('Create')).click();
      dialog().contains('p.MuiFormHelperText-root.Mui-error', 'Action date is required').should('be.visible');
      dialog().contains('span.MuiTypography-caption', 'Scanned document is required').should('be.visible');

      // Switch Case Type = Civil -> heading switches to "File Case"
      modalSelect(/Case Type/i).scrollIntoView().click();
      chooseSelectOption('Civil');
      dialog().contains('h6', exact('File Case')).scrollIntoView().should('be.visible');
      dialog().contains('h6', exact('Police Complaint')).should('not.exist');
    });

    it('should submit a complete New Village Visit (stubbed POST), show success toast, and close modal', () => {
      stubUploadSuccess('mou_agreement.png', 'image/png');
      cy.intercept('POST', `**${SAVE_API}*`, {
        statusCode: 200,
        body: { status: 1, message: 'Created' },
      }).as('createVisit');

      newVisitBtn().click();

      // Select Contract
      dialog().find('input[placeholder="Search by contract number"]').type('20');
      cy.wait('@getContracts', { timeout: 15000 });
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      // Case Type
      modalSelect(/Case Type/i).click();
      chooseSelectOption('Civil');

      // Meeting details
      modalInput(/Meeting Date/i).type('2026-11-10');
      modalInput(/Village Master Name/i).clear().type('Somchai Master');
      modalInput(/Village Master Mobile Number/i).clear().type('02055551234');
      modalTextarea(/Customer Current Location/i).type('Vientiane Capital');
      modalTextarea(/Customer Address/i).type('123 Main Road');
      modalInput(/Meeting Place/i).clear().type('Village Office');

      // LALCO Visitor
      modalInput(/LALCO Visitor/i).scrollIntoView().type('an');
      cy.wait('@getStaff', { timeout: 15000 });
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      // Attended & Customer Response
      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('Yes');
      modalTextarea(/Customer Response/i).type('Agreed to settle');

      // Payment = Yes
      modalSelect(/Customer Agrees to Pay/i).scrollIntoView().click();
      chooseSelectOption('Yes');
      modalInput(/Payment Date/i).scrollIntoView().type('2026-11-15');
      modalSelect(/Payment Method/i).click();
      chooseSelectOption('MOU');

      // Upload valid 1x1 PNG document and wait for preview UI to settle
      dialog().find('input[type="file"]:not([accept])').first().selectFile(
        {
          contents: Cypress.Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          ),
          fileName: 'mou_agreement.png',
          mimeType: 'image/png',
        },
        { force: true }
      );
      cy.wait('@uploadFile');
      dialog().contains('mou_agreement.png').should('be.visible');

      // Additional Assets
      modalTextarea(/Additional Assets/i)
        .scrollIntoView()
        .click()
        .type('Motorcycle')
        .should('have.value', 'Motorcycle');

      // Submit
      dialog().contains('button', exact('Create')).click();

      cy.wait('@createVisit').then(({ request, response }) => {
        expect(response.statusCode).to.eq(200);
        expect(request.body).to.include({
          case_type: 'civil',
          meeting_date: '2026-11-10',
          village_master_name: 'Somchai Master',
          village_master_mobile_number: '02055551234',
          meeting_place: 'Village Office',
          customer_attend: 'yes',
          payment_status: 'yes',
          payment_date: '2026-11-15',
          payment_type: '1',
          additional_assets: 'Motorcycle',
        });
        expect(request.body.lalco_visitor).to.be.a('number');
        expect(request.body.mou_or_payment_document).to.have.property('path', 'uploads/mou_agreement.png');
        expect(request.body).to.not.have.property('customer');
        expect(request.body).to.not.have.property('next_meeting_date');
      });

      dialog().should('not.exist');
      toast().should('be.visible').and('contain.text', 'Successfully save the village master meeting.');
    });

    it('should display server validation errors and keep modal open when POST fails', () => {
      cy.intercept('POST', `**${SAVE_API}*`, {
        statusCode: 400,
        body: {
          message: 'Server validation error',
          meeting_place: ['Meeting place rejected by server'],
        },
      }).as('createFailed');

      newVisitBtn().click();

      dialog().find('input[placeholder="Search by contract number"]').type('20');
      cy.wait('@getContracts', { timeout: 15000 });
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      modalSelect(/Case Type/i).click();
      chooseSelectOption('Civil');
      modalInput(/Meeting Date/i).type('2026-11-10');
      modalInput(/Village Master Name/i).clear().type('Test Master');
      modalInput(/Village Master Mobile Number/i).clear().type('02055551234');
      modalInput(/Meeting Place/i).clear().type('Hall');

      modalInput(/LALCO Visitor/i).scrollIntoView().type('an');
      cy.wait('@getStaff', { timeout: 15000 });
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('Yes');
      modalSelect(/Customer Agrees to Pay/i).scrollIntoView().click();
      chooseSelectOption('No');
      modalTextarea(/Additional Assets/i).scrollIntoView().type('None').should('have.value', 'None');
      modalInput(/Hearing \/ Next Meeting Date/i).scrollIntoView().type('2026-11-20');
      modalInput(/LALCO Attendee/i).scrollIntoView().type('an');
      cy.wait('@getStaff', { timeout: 15000 });
      cy.get('.MuiAutocomplete-popper ul.MuiAutocomplete-listbox li[role="option"]').first().click();

      dialog().contains('button', exact('Create')).click();
      cy.wait('@createFailed');

      dialog().should('be.visible');
      dialog().contains('Meeting place rejected by server').scrollIntoView().should('be.visible');
      toast().should('be.visible').and('contain.text', 'Server validation error');
    });
  });

  // ===========================================================================
  // 7. "View Village Master Details" Modal
  // ===========================================================================
  describe('7. "View Village Master Details" Modal', () => {
    it('should open View modal with all sections, cross-checked data, and close via X and Escape', () => {
      pickDynamicRow().then(({ index, contractNo, villageMaster, attended }) => {
        tableRows().eq(index).find('button[aria-label="View"]').click();

        dialog().should('be.visible').within(() => {
          cy.contains('h2.MuiDialogTitle-root', exact('View Village Master Details')).should('be.visible');
          cy.get('button[aria-label="close"]').should('be.visible');
          cy.get('input').should('not.exist');
          cy.get('textarea').should('not.exist');

          // Summary card
          cy.get('svg[data-testid="PersonIcon"]').should('be.visible');
          cy.contains(`Contract No: ${contractNo}`).should('be.visible');

          // Always-rendered detail cards and labels
          cy.contains('Contract information').scrollIntoView().should('be.visible');
          ['Contract', 'Customer Name', 'Case type', 'Meeting count'].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          cy.contains('Meeting details').scrollIntoView().should('be.visible');
          [
            'Village Master Name',
            'Village Master Mobile',
            'Customer Current Location',
            'Customer Address',
            'Meeting date',
            'Meeting place',
            'Lalco visitor',
            'Customer attend',
            'Customer response',
            'Next meeting date',
          ].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          if (villageMaster && villageMaster !== '-') {
            cy.contains(villageMaster).should('exist');
          }
          cy.contains('.MuiChip-label', exact(attended)).should('exist');

          cy.contains('Payment details').scrollIntoView().should('be.visible');
          ['Payment status', 'Payment date', 'Payment type'].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          cy.contains('Collateral details').scrollIntoView().should('be.visible');
          ['Collateral details', 'Additional assets'].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          cy.contains('Legal details').scrollIntoView().should('be.visible');
          ['Action date', 'Documents submitted', 'Hearing date', 'Lalco attendee', 'Case result'].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          cy.contains('Audit information').scrollIntoView().should('be.visible');
          ['Created at', 'Updated at'].forEach((lbl) => {
            cy.contains(lbl).should('exist');
          });

          // Close via X button
          cy.get('button[aria-label="close"]').click();
        });

        dialog().should('not.exist');

        // Re-open and close via Escape
        tableRows().eq(index).find('button[aria-label="View"]').click();
        dialog().should('be.visible');
        cy.get('body').type('{esc}');
        dialog().should('not.exist');
      });
    });

    it('should render MOU/Payment and Case File Document sections with image preview zoom and file link', () => {
      const tinyPngDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      cy.intercept('GET', `**${LIST_API}*`, {
        statusCode: 200,
        body: {
          total: 1,
          total_pages: 1,
          current_page: 1,
          next: null,
          previous: null,
          data: [
            {
              id: 888,
              contract_no: '2008888',
              customer_name: 'Mock Viewer Customer',
              customer_lao_name: '',
              case_type: 'civil',
              meeting_count: 1,
              village_master_name: 'Master One',
              village_master_mobile_number: '02055559999',
              customer_current_location: 'Vientiane',
              customer_address: 'Street 1',
              meeting_date: '2026-11-01',
              meeting_place: 'Hall A',
              lalco_visitor_name: 'Staff A',
              customer_attend: 'yes',
              customer_response: 'Agreed',
              next_meeting_date: null,
              payment_status: 'yes',
              payment_date: '2026-11-12',
              payment_type: '1',
              mou_or_payment_document: {
                path: tinyPngDataUrl,
                url: tinyPngDataUrl,
                file_name: 'mou_photo.png',
                content_type: 'image/png',
              },
              collateral_details: 'TOYOTA VIGO',
              additional_assets: 'None',
              documents_submitted: 'yes',
              action_date: '2026-11-05',
              documents_created: {
                path: 'https://example.com/files/case_doc.docx',
                url: 'https://example.com/files/case_doc.docx',
                file_name: 'case_doc.docx',
                content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
              hearing_date: '2026-11-20',
              lalco_attendee_name: 'Staff B',
              case_result: 'Pending',
              created_at: '2026-11-01T10:00:00Z',
              updated_at: '2026-11-02T10:00:00Z',
            },
          ],
        },
      }).as('mockDocRow');

      cy.reload();
      cy.wait('@mockDocRow');

      tableRows().first().find('button[aria-label="View"]').click();

      dialog().should('be.visible').within(() => {
        cy.contains('MOU/Payment Document').scrollIntoView().should('be.visible');
        cy.contains('Case File Document').scrollIntoView().should('be.visible');
        cy.get('a[target="_blank"]').should('exist');
      });

      // Click image thumbnail to open zoom preview if rendered as <img>
      dialog().then(($dlg) => {
        const $imgs = $dlg.find('img');
        if ($imgs.length > 0) {
          cy.wrap($imgs.first()).scrollIntoView().click();
          cy.get('button[aria-label="Close preview"]').should('be.visible').click();
          cy.get('button[aria-label="Close preview"]').should('not.exist');
        }
      });
    });
  });

  // ===========================================================================
  // 8. "Edit Village Master Visit" Modal & Stubbed Update
  // ===========================================================================
  describe('8. "Edit Village Master Visit" Modal & Stubbed Update', () => {
    it('should open Edit modal pre-populated with record values and close cleanly via Cancel, X, and Escape', () => {
      pickDynamicRow().then(({ index, contractNo, villageMaster, meetingCount }) => {
        tableRows().eq(index).find('button[aria-label="Edit"]').click();

        dialog().should('be.visible');
        dialog().contains('h2.MuiDialogTitle-root', exact('Edit Village Master Visit')).should('be.visible');
        dialog().contains('button', exact('Cancel')).should('be.visible');
        dialog().contains('button', exact('Update')).should('be.visible');
        dialog().contains('button', exact('Create')).should('not.exist');

        dialog().find('input[placeholder="Search by contract number"]')
          .should('be.enabled')
          .and('have.value', contractNo);

        modalInput(/^Meeting Count$/i).should('be.disabled').and('have.value', meetingCount);
        modalInput(/Meeting Date/i).invoke('val').should('match', /^\d{4}-\d{2}-\d{2}$/);
        modalTextarea(/^Collateral Details$/i).should('have.attr', 'readonly');

        if (villageMaster && villageMaster !== '-') {
          modalInput(/Village Master Name/i).should('have.value', villageMaster);
        }

        dialog().contains('button', exact('Cancel')).click();
        dialog().should('not.exist');

        // Verify X and Escape close
        tableRows().eq(index).find('button[aria-label="Edit"]').click();
        dialog().find('button[aria-label="close"]').click();
        dialog().should('not.exist');

        tableRows().eq(index).find('button[aria-label="Edit"]').click();
        dialog().should('be.visible');
        cy.get('body').type('{esc}');
        dialog().should('not.exist');
      });
    });

    it('should remove an existing uploaded file locally without making a network request', () => {
      stubUploadSuccess('edit_file.pdf', 'application/pdf');

      tableRows().first().find('button[aria-label="Edit"]').click();

      // Ensure a document section is visible (Payment = Yes) and upload a file if none exists
      modalSelect(/Customer Attended\?/i).scrollIntoView().click();
      chooseSelectOption('Yes');
      modalSelect(/Customer Agrees to Pay/i).scrollIntoView().click();
      chooseSelectOption('Yes');

      dialog().then(($dlg) => {
        if ($dlg.find('button[aria-label="Remove file"]').length === 0) {
          cy.get('[role="dialog"] input[type="file"]:not([accept])').first().selectFile(
            {
              contents: Cypress.Buffer.from('edit doc bytes'),
              fileName: 'edit_file.pdf',
              mimeType: 'application/pdf',
            },
            { force: true }
          );
          cy.wait('@uploadFile');
        }
      });

      cy.intercept('POST', `**${SAVE_API}*`).as('unexpectedSave');
      dialog().find('button[aria-label="Remove file"]').first().scrollIntoView().click();
      dialog().contains('No file selected').should('be.visible');
      cy.get('@unexpectedSave.all').should('have.length', 0);
    });

    it('should submit Edit changes via POST /api/village-master_meeting-save with record id and show update toast', () => {
      cy.intercept('POST', `**${SAVE_API}*`, {
        statusCode: 200,
        body: { status: 1, message: 'Updated' },
      }).as('updateVisit');

      pickDynamicRow().then(({ index, id }) => {
        tableRows().eq(index).find('button[aria-label="Edit"]').click();
        dialog().should('be.visible');

        modalInput(/Meeting Place/i).clear().type('Updated Cypress Hall').should('have.value', 'Updated Cypress Hall');
        dialog().contains('button', exact('Update')).scrollIntoView().click();

        cy.wait('@updateVisit').then(({ request, response }) => {
          expect(response.statusCode).to.eq(200);
          expect(request.body).to.have.property('id', Number(id));
          expect(request.body).to.have.property('meeting_place', 'Updated Cypress Hall');
        });

        dialog().should('not.exist');
        toast().should('be.visible').and('contain.text', 'Village Master Visit updated successfully.');
      });
    });

    it('should display error toast and keep Edit modal open when update fails', () => {
      cy.intercept('POST', `**${SAVE_API}*`, {
        statusCode: 500,
        body: { message: 'Failed to save update' },
      }).as('updateFailed');

      tableRows().first().find('button[aria-label="Edit"]').click();
      dialog().should('be.visible');

      modalInput(/Meeting Place/i).clear().type('Fail Test Hall');
      dialog().contains('button', exact('Update')).scrollIntoView().click();

      cy.wait('@updateFailed');
      toast().should('be.visible').and('contain.text', 'Failed to save update');
      dialog().should('be.visible');
    });
  });

  // ===========================================================================
  // 9. Sidebar Logout Action & Confirmation Modal
  // ===========================================================================
  describe('9. Sidebar Logout Action', () => {
    it('should open logout confirmation dialog, support Stay Signed In, and log out when confirmed', () => {
      cy.get('.MuiDrawer-docked button[aria-label="Logout"]')
        .scrollIntoView()
        .should('be.visible')
        .find('svg[data-testid="LogoutIcon"]')
        .should('exist');

      // Cancel via "Stay Signed In"
      cy.get('.MuiDrawer-docked button[aria-label="Logout"]').click();
      dialog().should('be.visible').within(() => {
        cy.contains('Sign out of your account?').should('be.visible');
        cy.contains('button', exact('Stay Signed In')).should('be.visible').click();
      });
      dialog().should('not.exist');
      cy.hash().should('include', 'village-master');

      // Confirm via "Logout"
      cy.get('.MuiDrawer-docked button[aria-label="Logout"]').click();
      dialog().should('be.visible').within(() => {
        cy.contains('button', exact('Logout')).should('be.visible').click();
      });

      cy.hash().should('include', 'login');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
    });
  });
});
