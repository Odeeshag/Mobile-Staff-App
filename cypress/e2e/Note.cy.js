/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/notes';
const API_PATH = '/api/get-note';
const CONTRACTS_API_PATH = '/api/get-contracts';
const ADD_NOTE_API_PATH = '/api/add-note';
const PAGE_SIZE = 11;
const EMPTY_TEXT = 'No data found';

const COLUMNS = [
  'ID',
  'Subject',
  'Customer',
  'Contract',
  'Created By',
  'Created At',
  'Actions'
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

// ---------- Selectors & Helper Functions ----------

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');

// Filter bar inputs
const subjectInput = () => cy.get('input[placeholder="e.g. Payment follow-up"]');
const customerInput = () => cy.get('input[placeholder="e.g. Somchai"]');
const contractInput = () => cy.get('input[placeholder="e.g. 2000022"]');

// Field-level inline clear buttons
const clearSubjectBtn = () => cy.get('button[aria-label="Clear Subject"]');
const clearCustomerBtn = () => cy.get('button[aria-label="Clear Customer Name"]');
const clearContractBtn = () => cy.get('button[aria-label="Clear Contract number"]');

// Global action & filter buttons
const clearAllButton = () => cy.contains('button', exact('Clear'));
const addNoteButton = () => cy.contains('button', exact('Add Note'));

// Pagination controls
const nextButton = () => cy.contains('button', exact('Next'));
const prevButton = () => cy.contains('button', exact('Previous'));
const currentPageButton = () => cy.get('button[aria-current="page"]');

// Table & Dialogs
const tableRows = () => cy.get('table.MuiTable-root tbody tr');
const dialog = () => cy.get('[role="dialog"]');
const alertToast = () => cy.get('[role="alert"], .MuiAlert-root');

// Helpers for API intercepts
const interceptListWith = (query, alias) => {
  cy.intercept({ method: 'GET', pathname: API_PATH, query }).as(alias);
};

const assertEmptyState = () => {
  tableRows().should('have.length', 1);
  cy.get('tbody').contains(EMPTY_TEXT).should('be.visible');
};

const assertDefaultTable = () => {
  tableRows().should('have.length', PAGE_SIZE);
  currentPageButton().should('have.text', '1');
};

/**
 * Retries until the table updates and every actual data row's column contains the expected text.
 * Ignores MUI Table empty spacer rows (<TableCell colSpan="..."/>) and loading rows.
 */
const assertColumnContains = (colIndex, expected) => {
  tableRows().should(($rows) => {
    const dataRows = $rows.filter((_, row) => {
      const tds = Cypress.$(row).find('td');
      return tds.length >= COLUMNS.length && !tds.first().attr('colspan');
    });
    expect(dataRows.length, 'data rows count').to.be.greaterThan(0);
    dataRows.each((_, row) => {
      const cell = Cypress.$(row).find('td').eq(colIndex).text().trim();
      expect(cell.toLowerCase()).to.include(expected.toLowerCase());
    });
  });
};

// =============================================================================
// Test Suite: Staff LMS - Notes Page
// =============================================================================
describe('Staff LMS - Notes Page Comprehensive Automation Suite', () => {

  beforeEach(() => {
    cy.intercept('GET', `**${API_PATH}*`).as('getNotes');
    cy.intercept('GET', `**${CONTRACTS_API_PATH}*`).as('getContracts');
    cy.intercept('POST', `**${ADD_NOTE_API_PATH}*`).as('createNote');
    cy.intercept('PUT', `**${ADD_NOTE_API_PATH}*`).as('updateNote');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');
    cy.visit(PAGE_URL);

    cy.wait('@getNotes', { timeout: 30000 });
    tableRows().should('have.length.greaterThan', 0);
  });

  // =========================================================================
  // 1. Authentication & Route Guard
  // =========================================================================
  describe('1. Authentication & Route Protection', () => {

    it('should redirect unauthenticated users navigating to #/notes to the login page', () => {
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.visit(PAGE_URL);
      cy.hash().should('include', 'login');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should allow authenticated users to view the Notes page and active sidebar navigation', () => {
      cy.url().should('include', '#/notes');
      cy.contains('.MuiTypography-root', exact('Notes')).should('be.visible');
      cy.get('aside, nav').contains('Notes').scrollIntoView().should('be.visible');
    });
  });

  // =========================================================================
  // 2. UI Rendering & Initial Page Layout
  // =========================================================================
  describe('2. UI Rendering & Initial Page Layout', () => {

    it('should display the page title "Notes"', () => {
      cy.get('header, main').contains('.MuiTypography-root', exact('Notes')).should('be.visible');
    });

    it('should display header action controls (Notifications, Language switch, Dark Mode)', () => {
      cy.get('button[aria-label="Notifications"], [data-testid*="Notifications"]').should('be.visible');
      cy.contains('EN').should('be.visible');
      cy.get('button[aria-label="Dark Mode"], button[aria-label="Light Mode"], [data-testid="DarkModeIcon"], [data-testid="LightModeIcon"]').should('be.visible');
    });

    it('should render all 3 filter search inputs empty with correct placeholders and labels', () => {
      cy.contains('label', exact('Subject')).should('be.visible');
      subjectInput().should('be.visible').and('have.value', '');

      cy.contains('label', exact('Customer Name')).should('be.visible');
      customerInput().should('be.visible').and('have.value', '');

      cy.contains('label', exact('Contract Number')).should('be.visible');
      contractInput().should('be.visible').and('have.value', '');

      // Inline clear buttons should not exist when inputs are empty
      clearSubjectBtn().should('not.exist');
      clearCustomerBtn().should('not.exist');
      clearContractBtn().should('not.exist');
    });

    it('should render the "Clear" filters button disabled initially and "Add Note" button enabled', () => {
      clearAllButton().should('be.visible').and('be.disabled');
      addNoteButton().should('be.visible').and('not.be.disabled');
    });

    it('should render the data table with all 7 expected column headers in correct order', () => {
      cy.get('table.MuiTable-root thead th').should('have.length', COLUMNS.length).each(($th, i) => {
        expect($th.text().trim()).to.eq(COLUMNS[i]);
      });
    });

    it('should render 11 rows by default with populated cells and action buttons', () => {
      tableRows().should('have.length', PAGE_SIZE).each(($row) => {
        cy.wrap($row).find('td').should('have.length', COLUMNS.length);
        cy.wrap($row).find('td').eq(COL['ID']).invoke('text').should('match', /^\s*\d+\s*$/);
        cy.wrap($row).find('td').eq(COL['Subject']).invoke('text').should('not.be.empty');
        cy.wrap($row).find('td').eq(COL['Contract']).invoke('text').should('match', /^\s*\d+\s*$/);
        cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
          cy.get('button[aria-label="View"], [data-testid="VisibilityIcon"]').should('exist');
          cy.get('button[aria-label="Edit"], [data-testid="EditIcon"]').should('exist');
        });
      });
    });
  });

  // =========================================================================
  // 3. Filter & Search Controls
  // =========================================================================
  describe('3. Filter & Search Functionality', () => {

    it('should filter notes by Subject with 300ms debounce and update table', () => {
      // Allow initial mount debounce to settle
      cy.wait(500);

      // Find first valid data row and extract a clean search term from its Subject
      cy.get('table.MuiTable-root tbody tr').then(($rows) => {
        let targetSubject = '';
        $rows.each((_, row) => {
          const tds = Cypress.$(row).find('td');
          if (!targetSubject && tds.length >= COLUMNS.length && !tds.first().attr('colspan')) {
            const raw = tds.eq(COL['Subject']).text().trim();
            if (raw) {
              targetSubject = raw;
            }
          }
        });

        const clean = targetSubject.replace(/[\[\]\(\)\{\}]/g, '').trim();
        const words = clean.split(/\s+/).filter(w => w.length >= 2);
        const searchTerm = words.length > 0 ? words[0] : clean.slice(0, 4);

        interceptListWith({ subject: searchTerm }, 'filterBySubject');
        subjectInput().clear().type(searchTerm);

        cy.wait('@filterBySubject', { timeout: 20000 }).then(({ request, response }) => {
          expect(response.statusCode).to.eq(200);
          expect(request.url).to.include(`subject=${encodeURIComponent(searchTerm)}`);
        });

        assertColumnContains(COL['Subject'], searchTerm);
      });
    });

    it('should show inline clear button in Subject input and clear filter when clicked', () => {
      subjectInput().type('Payment');
      clearSubjectBtn().should('be.visible').click();
      subjectInput().should('have.value', '');
      clearSubjectBtn().should('not.exist');
    });

    it('should filter notes by Customer Name and display matching records', () => {
      cy.wait(500);

      tableRows().filter((_, row) => Cypress.$(row).find('td').length >= COLUMNS.length).first()
        .find('td').eq(COL['Customer']).invoke('text').then((customer) => {
          const words = customer.match(/[a-zA-Z]{3,}/g) || ['Somchai'];
          const searchTerm = words[0];

          interceptListWith({ customer_name: searchTerm }, 'filterByCustomer');
          customerInput().clear().type(searchTerm);

          cy.wait('@filterByCustomer', { timeout: 15000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
          });

          assertColumnContains(COL['Customer'], searchTerm);
        });
    });

    it('should show inline clear button in Customer Name input and clear filter when clicked', () => {
      customerInput().type('Somchai');
      clearCustomerBtn().should('be.visible').click();
      customerInput().should('have.value', '');
      clearCustomerBtn().should('not.exist');
    });

    it('should filter notes by Contract Number', () => {
      cy.wait(500);

      tableRows().filter((_, row) => Cypress.$(row).find('td').length >= COLUMNS.length).first()
        .find('td').eq(COL['Contract']).invoke('text').then((contractNo) => {
          const trimmedContract = contractNo.replace(/\s+/g, ' ').trim();

          interceptListWith({ contract_number: trimmedContract }, 'filterByContract');
          contractInput().clear().type(trimmedContract);

          cy.wait('@filterByContract', { timeout: 15000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
          });

          assertColumnContains(COL['Contract'], trimmedContract);
        });
    });

    it('should show inline clear button in Contract Number input and clear filter when clicked', () => {
      contractInput().type('2000022');
      clearContractBtn().should('be.visible').click();
      contractInput().should('have.value', '');
      clearContractBtn().should('not.exist');
    });

    it('should submit search immediately upon pressing Enter key without waiting for debounce', () => {
      interceptListWith({ subject: 'follow-up' }, 'enterSearch');
      subjectInput().type('follow-up{enter}');
      cy.wait('@enterSearch', { timeout: 10000 });
      tableRows().should('have.length.greaterThan', 0);
    });

    it('should enable global Clear button when filters are populated and reset all filters on click', () => {
      clearAllButton().should('be.disabled');

      subjectInput().type('Test Subject');
      customerInput().type('Test Customer');
      contractInput().type('123456');

      clearAllButton().should('be.enabled');

      interceptListWith({ page: '1' }, 'resetList');
      clearAllButton().click();

      // Verify all inputs are wiped
      subjectInput().should('have.value', '');
      customerInput().should('have.value', '');
      contractInput().should('have.value', '');

      // Clear button should return to disabled state
      clearAllButton().should('be.disabled');
    });

    it('should display "No data found" empty state when no notes match the search query', () => {
      const nonExistent = 'XYZ_NO_RECORD_MATCH_99999';
      interceptListWith({ subject: nonExistent }, 'noMatchSearch');
      subjectInput().type(`${nonExistent}{enter}`);

      cy.wait('@noMatchSearch', { timeout: 15000 });
      assertEmptyState();
    });
  });

  // =========================================================================
  // 4. Pagination Controls
  // =========================================================================
  describe('4. Pagination Controls', () => {

    it('should disable the Previous button on Page 1', () => {
      currentPageButton().should('have.text', '1');
      prevButton().should('be.visible').and('be.disabled');
      nextButton().should('be.visible');
    });

    it('should navigate to Page 2 when clicking Next, update page query param, and enable Previous button', () => {
      // Allow component initial 300ms filter debounce to settle
      cy.wait(500);

      nextButton().scrollIntoView().then(($nextBtn) => {
        if ($nextBtn.is(':disabled')) {
          cy.log('[SKIP] Next button is disabled (only 1 page of data exists).');
          return;
        }

        interceptListWith({ page: '2', page_size: String(PAGE_SIZE) }, 'getPage2');

        cy.wrap($nextBtn).click();

        cy.wait('@getPage2', { timeout: 20000 }).then(({ request, response }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('page')).to.eq('2');
          expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
          expect(response.statusCode).to.eq(200);
        });

        currentPageButton().should('have.text', '2');
        prevButton().should('not.be.disabled');
      });
    });

    it('should navigate back to Page 1 when clicking Previous from Page 2 and re-disable Previous button', () => {
      // Allow component initial 300ms filter debounce to settle
      cy.wait(500);

      nextButton().scrollIntoView().then(($nextBtn) => {
        if ($nextBtn.is(':disabled')) {
          cy.log('[SKIP] Only 1 page of data exists.');
          return;
        }

        interceptListWith({ page: '2' }, 'getPage2');
        cy.wrap($nextBtn).click();
        cy.wait('@getPage2', { timeout: 20000 });
        currentPageButton().should('have.text', '2');

        interceptListWith({ page: '1' }, 'getPage1');
        prevButton().click();
        cy.wait('@getPage1', { timeout: 20000 });
        currentPageButton().should('have.text', '1');
        prevButton().should('be.disabled');
      });
    });

    it('should navigate directly to page when clicking page number button', () => {
      cy.wait(500);
      cy.get('main').find('button').filter(':contains("2")').first().then(($btn) => {
        if ($btn.length > 0) {
          interceptListWith({ page: '2' }, 'getPageDirect');
          cy.wrap($btn).click();
          cy.wait('@getPageDirect', { timeout: 20000 });
          currentPageButton().should('have.text', '2');
        }
      });
    });
  });

  // =========================================================================
  // 5. "Add New Note" Modal Form & Validations
  // =========================================================================
  describe('5. "Add New Note" Modal Form & Validations', () => {

    it('should open the Add New Note modal upon clicking "Add Note" button and render all fields', () => {
      addNoteButton().click();

      dialog().should('be.visible').within(() => {
        cy.contains('.MuiDialogTitle-root', exact('Add New Note')).should('be.visible');
        cy.get('button[aria-label="close"]').should('be.visible');

        // Form Fields
        cy.contains('label', /Contract number/i).should('be.visible');
        cy.get('input[placeholder="Search by contract number"]').should('be.visible');

        cy.contains('label', /Subject/i).should('be.visible');
        cy.get('input[placeholder="Enter note subject"]').should('be.visible');

        cy.contains('label', /Note Details/i).should('be.visible');
        cy.get('textarea[placeholder="Enter note details"]').should('be.visible');

        cy.contains('label', /Date/i).should('be.visible');
        cy.get('input[type="date"]').should('be.visible');

        // Buttons
        cy.contains('button', exact('Cancel')).should('be.visible');
        cy.contains('button', exact('Create')).should('be.visible');
      });
    });

    it('should close the Add New Note modal when clicking Cancel button', () => {
      addNoteButton().click();
      dialog().should('be.visible');
      dialog().contains('button', exact('Cancel')).click();
      dialog().should('not.exist');
    });

    it('should close the Add New Note modal when clicking the top-right close "X" button', () => {
      addNoteButton().click();
      dialog().should('be.visible');
      dialog().find('button[aria-label="close"]').click();
      dialog().should('not.exist');
    });

    it('should display required validation error messages when submitting empty form', () => {
      addNoteButton().click();
      dialog().should('be.visible');

      // Click Create without filling required fields
      dialog().contains('button', exact('Create')).click();

      // Verify validation helper texts appear
      dialog().within(() => {
        cy.contains('.MuiFormHelperText-root', 'Contract number is required').should('be.visible');
        cy.contains('.MuiFormHelperText-root', 'Subject is required').should('be.visible');
        cy.contains('.MuiFormHelperText-root', 'Note details are required').should('be.visible');
      });
    });

    it('should enforce Contract number autocomplete with >= 2 characters search requirement', () => {
      addNoteButton().click();
      dialog().should('be.visible');

      // Type 1 character - should not trigger backend call
      dialog().find('input[placeholder="Search by contract number"]').type('2');
      cy.get('@getContracts.all').should('have.length', 0);

      // Type second character - triggers search
      dialog().find('input[placeholder="Search by contract number"]').type('0');
      cy.wait('@getContracts', { timeout: 15000 }).then(({ request, response }) => {
        expect(request.url).to.include('search=20');
        expect(response.statusCode).to.eq(200);
      });

      // Verify options listbox renders
      cy.get('[role="listbox"]').should('be.visible').find('[role="option"]').should('have.length.greaterThan', 0);
    });

    it('should auto-populate read-only Customer Name when selecting a contract from autocomplete', () => {
      addNoteButton().click();
      dialog().should('be.visible');

      dialog().find('input[placeholder="Search by contract number"]').type('20');
      cy.wait('@getContracts', { timeout: 15000 });

      // Select first option from dropdown
      cy.get('[role="listbox"]').find('[role="option"]').first().click();

      // Verify Customer Name input appears and is read-only
      dialog().within(() => {
        cy.contains('label', exact('Customer Name')).should('be.visible');
        cy.get('input[readonly]').should('be.visible').and('not.have.value', '');
      });
    });

    it('should dynamically update the character counter and enforce max length 500 on Note Details', () => {
      addNoteButton().click();
      dialog().should('be.visible');

      dialog().within(() => {
        // Initial character count
        cy.contains('.MuiFormHelperText-root', '0/500').should('be.visible');

        // Type 20 characters
        const testText = '12345678901234567890';
        cy.get('textarea[placeholder="Enter note details"]').type(testText);
        cy.contains('.MuiFormHelperText-root', '20/500').should('be.visible');

        // Verify maxlength attribute
        cy.get('textarea[placeholder="Enter note details"]').should('have.attr', 'maxlength', '500');
      });
    });

    it('should default the Date field to today in YYYY-MM-DD format', () => {
      const todayISO = new Date().toISOString().split('T')[0];
      addNoteButton().click();
      dialog().should('be.visible');

      dialog().find('input[type="date"]').should('have.value', todayISO);
    });

    it('should successfully create a new note via POST /api/add-note, show success toast, and close modal', () => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testSubject = `Automated Test Note ${randomSuffix}`;
      const testDetails = `Test details content generated for automated regression test ${randomSuffix}`;

      addNoteButton().click();
      dialog().should('be.visible');

      // Select contract
      dialog().find('input[placeholder="Search by contract number"]').type('20');
      cy.wait('@getContracts', { timeout: 15000 });
      cy.get('[role="listbox"]').find('[role="option"]').first().click();

      // Fill Subject and Details
      dialog().find('input[placeholder="Enter note subject"]').type(testSubject);
      dialog().find('textarea[placeholder="Enter note details"]').type(testDetails);

      // Submit
      dialog().contains('button', exact('Create')).click();

      // Verify POST request payload and status
      cy.wait('@createNote', { timeout: 20000 }).then(({ request, response }) => {
        expect(request.method).to.eq('POST');
        expect(request.body).to.have.property('subject', testSubject);
        expect(request.body).to.have.property('note_details', testDetails);
        expect(request.body).to.have.property('contract_no');
        expect(response.statusCode).to.be.oneOf([200, 201]);
      });

      // Verify modal unmounts
      dialog().should('not.exist');

      // Verify success toast
      alertToast().should('be.visible').and('contain.text', 'Note added successfully');

      // Verify notes list is reloaded
      cy.wait('@getNotes', { timeout: 20000 });
    });
  });

  // =========================================================================
  // 6. "Note Details" View Modal
  // =========================================================================
  describe('6. "Note Details" View Modal', () => {

    it('should open Note Details modal upon clicking View icon button on a row', () => {
      // Capture row data to cross-check in modal
      tableRows().first().within(() => {
        cy.get('td').eq(COL['Subject']).invoke('text').as('expectedSubject');
        cy.get('td').eq(COL['Contract']).invoke('text').as('expectedContract');
        cy.get('button[aria-label="View"], [data-testid="VisibilityIcon"]').first().click();
      });

      dialog().should('be.visible').within(() => {
        cy.contains('.MuiDialogTitle-root', exact('Note Details')).should('be.visible');
        cy.get('button[aria-label="close"]').should('be.visible');

        // Verify fields exist in modal
        cy.contains('Contract No').should('be.visible');
        cy.contains('Customer').should('be.visible');
        cy.contains('Customer LMS ID').should('be.visible');
        cy.contains('Date').should('be.visible');
        cy.contains('Created At').should('be.visible');
        cy.contains('Created By').should('be.visible');
        cy.contains('Description').should('be.visible');

        // Cross-check captured subject
        cy.get('@expectedSubject').then((subject) => {
          cy.contains(subject.trim()).should('be.visible');
        });

        // Cross-check captured contract
        cy.get('@expectedContract').then((contract) => {
          cy.contains(contract.trim()).should('be.visible');
        });

        // Confirm modal is purely read-only (no editable form inputs)
        cy.get('input').should('not.exist');
        cy.get('textarea').should('not.exist');
      });
    });

    it('should close the Note Details modal when clicking top-right close "X" button', () => {
      tableRows().first().find('button[aria-label="View"], [data-testid="VisibilityIcon"]').first().click();
      dialog().should('be.visible');
      dialog().find('button[aria-label="close"]').click();
      dialog().should('not.exist');
    });
  });

  // =========================================================================
  // 7. "Edit Note" Modal Workflow
  // =========================================================================
  describe('7. "Edit Note" Modal Workflow', () => {

    it('should open Edit Note modal with pre-filled fields and disabled contract field', () => {
      tableRows().first().within(() => {
        cy.get('td').eq(COL['Subject']).invoke('text').as('initialSubject');
        cy.get('td').eq(COL['Contract']).invoke('text').as('initialContract');
        cy.get('button[aria-label="Edit"], [data-testid="EditIcon"]').first().click();
      });

      dialog().should('be.visible').within(() => {
        cy.contains('.MuiDialogTitle-root', exact('Edit Note')).should('be.visible');
        cy.get('button[aria-label="close"]').should('be.visible');

        // Contract number should be immutable (disabled)
        cy.get('input[placeholder="Search by contract number"]').should('be.disabled');

        // Customer name should be read-only
        cy.get('input[readonly]').should('be.visible');

        // Subject should be populated and editable
        cy.get('@initialSubject').then((subject) => {
          cy.get('input[placeholder="Enter note subject"]').should('have.value', subject.trim());
        });

        // Note Details should be populated and editable
        cy.get('textarea[placeholder="Enter note details"]').should('not.have.value', '');

        // Action buttons
        cy.contains('button', exact('Cancel')).should('be.visible');
        cy.contains('button', exact('Update')).should('be.visible');
      });
    });

    it('should close Edit Note modal without saving when clicking Cancel', () => {
      tableRows().first().find('button[aria-label="Edit"], [data-testid="EditIcon"]').first().click();
      dialog().should('be.visible');
      dialog().contains('button', exact('Cancel')).click();
      dialog().should('not.exist');
    });

    it('should display validation error when Subject is cleared in Edit modal', () => {
      tableRows().first().find('button[aria-label="Edit"], [data-testid="EditIcon"]').first().click();
      dialog().should('be.visible');

      dialog().find('input[placeholder="Enter note subject"]').clear();
      dialog().contains('button', exact('Update')).click();

      dialog().contains('.MuiFormHelperText-root', 'Subject is required').should('be.visible');
    });

    it('should display validation error when Note Details is cleared in Edit modal', () => {
      tableRows().first().find('button[aria-label="Edit"], [data-testid="EditIcon"]').first().click();
      dialog().should('be.visible');

      dialog().find('textarea[placeholder="Enter note details"]').clear();
      dialog().contains('button', exact('Update')).click();

      dialog().contains('.MuiFormHelperText-root', 'Note details are required').should('be.visible');
    });

    it('should successfully update a note via PUT /api/add-note and show update toast', () => {
      const updateTag = ` - Updated ${Date.now() % 10000}`;

      tableRows().first().find('button[aria-label="Edit"], [data-testid="EditIcon"]').first().click();
      dialog().should('be.visible');

      // Append update tag to subject
      dialog().find('input[placeholder="Enter note subject"]').type(updateTag);

      // Submit update
      dialog().contains('button', exact('Update')).click();

      // Verify PUT API call
      cy.wait('@updateNote', { timeout: 20000 }).then(({ request, response }) => {
        expect(request.method).to.eq('PUT');
        expect(request.body).to.have.property('id');
        expect(request.body.subject).to.include(updateTag);
        expect(response.statusCode).to.be.oneOf([200, 204]);
      });

      // Verify modal unmounts
      dialog().should('not.exist');

      // Verify success notification
      alertToast().should('be.visible').and('contain.text', 'Note updated successfully');

      // Verify table refresh
      cy.wait('@getNotes', { timeout: 20000 });
    });
  });

  // =========================================================================
  // 8. Header Controls & Accessibility
  // =========================================================================
  describe('8. Header Controls & Accessibility', () => {

    it('should display the theme toggle and verify Dark Mode button presence', () => {
      cy.get('button[aria-label="Dark Mode"], button[aria-label="Light Mode"], [data-testid="DarkModeIcon"], [data-testid="LightModeIcon"]')
        .should('be.visible');
    });

    it('should display the language indicator in the top bar', () => {
      cy.contains('EN').should('be.visible');
    });

    it('should display notifications icon button in header', () => {
      cy.get('button[aria-label="Notifications"], [data-testid*="Notifications"]').should('be.visible');
    });
  });
});
