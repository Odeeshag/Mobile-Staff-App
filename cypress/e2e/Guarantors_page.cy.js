/// <reference types="cypress" />

const PAGE_URL = 'http://54.255.136.172/#/guarantors';
const API_PATH = '/api/get-guarantors';
const PAGE_SIZE = 11;

const COLUMNS = [
  'LMS Guarantor ID',
  'Contract No',
  'Guarantor Name',
  'Lao Name',
  'Phone',
  'Relationship',
  'Actions'
];
const COL = COLUMNS.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

const SALES_ORG_FILTERS = [
  'G DEPARTMENT',
  'DEPARTMENT',
  'BRANCH',
  'UNIT',
  'MINI UNIT'
];

const COLLECTION_ORG_FILTERS = [
  'G DEPARTMENT',
  'DEPARTMENT',
  'COLLECTION UNIT',
  'COLLECTION TL',
  'COLLECTION'
];

const MODAL_DETAIL_FIELDS = [
  'Lao Name',
  'Phone',
  'Relationship',
  'Contract No',
  'House No',
  'Address Unit',
  'Village',
  'City',
  'Province',
  'Postal Code',
  'Id Card Number'
];

// ---------- Selectors & Helper Functions ----------

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');

const guarantorNameInput = () => cy.get('input[placeholder="e.g. Somchai"]');
const phoneInput = () => cy.get('input[placeholder="e.g. 02055551234"]');
const contractInput = () => cy.get('input[placeholder="e.g. 2000022"]');

const clearAllButton = () => cy.contains('button', exact('Clear'));
const orgFiltersButton = () => cy.contains('button', /^\s*Org Filters/i);

// Target the .MuiChip-root container directly
const salesChip = () => cy.contains('.MuiChip-root', exact('Sales'));
const collectionChip = () => cy.contains('.MuiChip-root', exact('Collection'));

const nextButton = () => cy.contains('button', exact('Next'));
const prevButton = () => cy.contains('button', exact('Previous'));
const paginationContainer = () => nextButton().parent();
const currentPageButton = () => cy.get('button[aria-current="page"]');
const tableRows = () => cy.get('table tbody tr');
const dialog = () => cy.get('[role="dialog"]');

// Target the combobox strictly via its <label> tag to avoid collision with chip spans
const orgSelect = (label) =>
  cy.contains('label', exact(label))
    .parent()
    .find('[role="combobox"]');

const chooseOption = (optionText) => {
  cy.get('[role="listbox"]').should('be.visible')
    .contains('li, [role="option"]', exact(optionText)).click();
  cy.get('[role="listbox"]').should('not.exist');
};

const closeListbox = () => {
  cy.focused().type('{esc}');
  cy.get('[role="listbox"]').should('not.exist');
};

const interceptListWith = (query, alias) => {
  cy.intercept({ method: 'GET', pathname: API_PATH, query }).as(alias);
};

const assertDefaultTable = () => {
  tableRows().should('have.length', PAGE_SIZE);
  currentPageButton().should('have.text', '1');
};

const assertEmptyState = () => {
  cy.contains('h6', exact('No matching records found')).should('be.visible');
  cy.contains('p', exact("We couldn't find any guarantors matching your search.")).should('be.visible');
};

describe('Staff LMS - Guarantors Page Test Suite', () => {

  beforeEach(() => {
    cy.intercept('GET', `**${API_PATH}*`).as('getGuarantors');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');
    cy.visit(PAGE_URL);

    cy.wait('@getGuarantors', { timeout: 30000 });
    tableRows().should('have.length.greaterThan', 0);
  });

  // =========================================================================
  // 1. UI Rendering & Initial Page Layout
  // =========================================================================
  describe('UI Rendering & Page Layout', () => {

    it('should navigate to the guarantors page and display correct header title', () => {
      cy.url().should('include', '#/guarantors');
      cy.get('header').contains(exact('Guarantors')).should('be.visible');
    });

    it('should invoke the get-guarantors API with page 1, page size 11, and department sales on initial load', () => {
      cy.reload();
      cy.wait('@getGuarantors', { timeout: 30000 }).then(({ request, response }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).to.eq('1');
        expect(url.searchParams.get('page_size')).to.eq(String(PAGE_SIZE));
        expect(url.searchParams.get('department')).to.eq('sales');
        expect(response.statusCode).to.eq(200);
      });
    });

    it('should render both department chips with Sales active by default', () => {
      salesChip().should('be.visible')
        .and('have.css', 'color', 'rgb(255, 255, 255)')
        .and('have.css', 'background-color', 'rgb(24, 78, 59)');

      collectionChip().should('be.visible')
        .and('have.css', 'color', 'rgba(0, 0, 0, 0.6)')
        .and('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    });

    it('should render Guarantor Name, Phone, and Contract No search inputs empty', () => {
      cy.contains('label', exact('Guarantor Name')).should('be.visible');
      guarantorNameInput().should('be.visible').and('have.value', '');

      cy.contains('label', exact('Phone')).should('be.visible');
      phoneInput().should('be.visible').and('have.value', '');

      cy.contains('label', exact('Contract No')).should('be.visible');
      contractInput().should('be.visible').and('have.value', '');

      // Field-level inline clear buttons should not exist when inputs are empty
      cy.get('button[aria-label="Clear Guarantor Name"]').should('not.exist');
      cy.get('button[aria-label="Clear Phone"]').should('not.exist');
      cy.get('button[aria-label="Clear Contract No"]').should('not.exist');
    });

    it('should render the Org Filters toggle button and a disabled Clear button', () => {
      orgFiltersButton().should('be.visible').and('contain.text', 'Org Filters');
      clearAllButton().should('be.visible').and('be.disabled');
    });

    it('should render the data table with all 7 expected column headers in order', () => {
      cy.get('table thead th').should('have.length', COLUMNS.length).each(($th, i) => {
        expect($th.text().trim()).to.eq(COLUMNS[i]);
      });
    });

    it('should render 11 rows by default with populated LMS Guarantor ID, Contract No, and View action', () => {
      tableRows().should('have.length', PAGE_SIZE).each(($row) => {
        cy.wrap($row).find('td').should('have.length', COLUMNS.length);
        cy.wrap($row).find('td').eq(COL['LMS Guarantor ID']).invoke('text').should('match', /^\s*\d+\s*$/);
        cy.wrap($row).find('td').eq(COL['Contract No']).invoke('text').should('match', /^\s*\d+\s*$/);
        cy.wrap($row).find('td').eq(COL['Actions']).within(() => {
          cy.get('button[aria-label="View"], svg[data-testid="VisibilityIcon"]').should('exist');
        });
      });
    });
  });

  // =========================================================================
  // 2. Department Mode Switching (Sales vs Collection)
  // =========================================================================
  describe('Department Mode Switching', () => {

    it('should switch to Collection mode and request collection department data', () => {
      interceptListWith({ department: 'collection' }, 'getCollectionGuarantors');

      collectionChip().click();

      cy.wait('@getCollectionGuarantors', { timeout: 20000 }).then(({ request, response }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('department')).to.eq('collection');
        expect(response.statusCode).to.eq(200);
      });

      // Verify active chip styling toggled (active chip has white text, inactive has gray text)
      collectionChip().should('have.css', 'color', 'rgb(255, 255, 255)')
        .and('have.css', 'background-color').and('not.eq', 'rgba(0, 0, 0, 0)');
      salesChip().should('have.css', 'color', 'rgba(0, 0, 0, 0.6)')
        .and('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

      // Table updates with data
      tableRows().should('have.length.greaterThan', 0);
    });

    it('should display Collection Org Filters hierarchy when in Collection mode', () => {
      interceptListWith({ department: 'collection' }, 'getCollectionGuarantors');
      collectionChip().click();
      cy.wait('@getCollectionGuarantors', { timeout: 20000 });

      orgFiltersButton().click();

      COLLECTION_ORG_FILTERS.forEach((filterLabel) => {
        cy.contains('label', exact(filterLabel)).should('be.visible');
        orgSelect(filterLabel).should('be.visible').and('have.text', 'All');
      });

      // Sales-specific filters (Branch, Unit, Mini Unit) must not be present
      ['BRANCH', 'UNIT', 'MINI UNIT'].forEach((filterLabel) => {
        cy.contains('label', exact(filterLabel)).should('not.exist');
      });

      // Collapse org panel
      orgFiltersButton().click();
    });

    it('should switch back to Sales mode and reload sales department data', () => {
      // First switch to Collection
      collectionChip().click();
      cy.wait('@getGuarantors', { timeout: 20000 });

      // Now switch back to Sales
      interceptListWith({ department: 'sales' }, 'getSalesGuarantors');
      salesChip().click();

      cy.wait('@getSalesGuarantors', { timeout: 20000 }).then(({ request, response }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('department')).to.eq('sales');
        expect(response.statusCode).to.eq(200);
      });

      // Verify Sales chip is active again
      salesChip().should('have.css', 'color', 'rgb(255, 255, 255)');
      collectionChip().should('have.css', 'color', 'rgba(0, 0, 0, 0.6)');

      tableRows().should('have.length', PAGE_SIZE);
    });
  });

  // =========================================================================
  // 3. Search & Filter Bar Controls
  // =========================================================================
  describe('Search Functionality', () => {

    it('should filter by Guarantor Name on pressing Enter', () => {
      // Capture a guarantor name from the first row
      tableRows().first().find('td').eq(COL['Guarantor Name']).invoke('text').then((rawName) => {
        const name = rawName.trim();
        interceptListWith({ guarantor_name: name }, 'searchName');

        guarantorNameInput().type(`${name}{enter}`);

        cy.wait('@searchName', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        tableRows().should('have.length.greaterThan', 0);
        tableRows().each(($row) => {
          cy.wrap($row).find('td').eq(COL['Guarantor Name']).invoke('text').then((cellText) => {
            expect(cellText.toLowerCase()).to.include(name.toLowerCase());
          });
        });

        clearAllButton().should('be.enabled');
      });
    });

    it('should clear Guarantor Name using its inline clear (X) icon', () => {
      guarantorNameInput().type('TestGuarantor');
      cy.get('button[aria-label="Clear Guarantor Name"]').should('be.visible').click();

      guarantorNameInput().should('have.value', '');
      cy.get('button[aria-label="Clear Guarantor Name"]').should('not.exist');
    });

    it('should filter by Phone number on pressing Enter', () => {
      tableRows().first().find('td').eq(COL['Phone']).invoke('text').then((rawPhone) => {
        const phone = rawPhone.trim();
        interceptListWith({ phone }, 'searchPhone');

        phoneInput().type(`${phone}{enter}`);

        cy.wait('@searchPhone', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        tableRows().should('have.length.greaterThan', 0);
        tableRows().first().find('td').eq(COL['Phone']).should('contain.text', phone);

        clearAllButton().should('be.enabled');
      });
    });

    it('should clear Phone using its inline clear (X) icon', () => {
      phoneInput().type('02055551234');
      cy.get('button[aria-label="Clear Phone"]').should('be.visible').click();

      phoneInput().should('have.value', '');
      cy.get('button[aria-label="Clear Phone"]').should('not.exist');
    });

    it('should filter by Contract No on pressing Enter', () => {
      tableRows().first().find('td').eq(COL['Contract No']).invoke('text').then((rawContract) => {
        const contractNo = rawContract.trim();
        interceptListWith({ contract_no: contractNo }, 'searchContract');

        contractInput().type(`${contractNo}{enter}`);

        cy.wait('@searchContract', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        tableRows().should('have.length', 1);
        tableRows().first().find('td').eq(COL['Contract No']).should('have.text', contractNo);

        clearAllButton().should('be.enabled');
      });
    });

    it('should clear Contract No using its inline clear (X) icon', () => {
      contractInput().type('2000022');
      cy.get('button[aria-label="Clear Contract No"]').should('be.visible').click();

      contractInput().should('have.value', '');
      cy.get('button[aria-label="Clear Contract No"]').should('not.exist');
    });
  });

  // =========================================================================
  // 4. Empty State View
  // =========================================================================
  describe('Empty State Handling', () => {

    it('should display the empty state message when a search returns zero results', () => {
      const nonExistentQuery = 'NON_EXISTENT_GUARANTOR_99999';
      interceptListWith({ guarantor_name: nonExistentQuery }, 'searchEmpty');

      guarantorNameInput().type(`${nonExistentQuery}{enter}`);

      cy.wait('@searchEmpty', { timeout: 20000 });
      assertEmptyState();
      prevButton().should('be.disabled');
      nextButton().should('be.disabled');
    });

    it('should restore default data table after clearing empty search results', () => {
      guarantorNameInput().type('NON_EXISTENT_GUARANTOR_99999{enter}');
      cy.wait('@getGuarantors');
      assertEmptyState();

      clearAllButton().click();
      cy.wait('@getGuarantors');

      guarantorNameInput().should('have.value', '');
      assertDefaultTable();
    });
  });

  // =========================================================================
  // 5. Organizational Filters (Org Filters Panel)
  // =========================================================================
  describe('Org Filters Panel', () => {

    it('should expand and collapse the Org Filters accordion panel', () => {
      SALES_ORG_FILTERS.forEach((filterLabel) => {
        cy.contains('label', exact(filterLabel)).should('not.exist');
      });

      // Expand panel
      orgFiltersButton().click();
      SALES_ORG_FILTERS.forEach((filterLabel) => {
        cy.contains('label', exact(filterLabel)).should('be.visible');
        orgSelect(filterLabel).should('be.visible');
      });

      // Collapse panel
      orgFiltersButton().click();
      SALES_ORG_FILTERS.forEach((filterLabel) => {
        cy.contains('label', exact(filterLabel)).should('not.exist');
      });
    });

    it('should display all Sales org filter dropdown defaults as "All"', () => {
      orgFiltersButton().click();

      SALES_ORG_FILTERS.forEach((filterLabel) => {
        orgSelect(filterLabel).should('have.text', 'All');
      });

      orgFiltersButton().click();
    });

    it('should list options for G DEPARTMENT with "All" first', () => {
      orgFiltersButton().click();

      orgSelect('G DEPARTMENT').click();
      cy.get('[role="listbox"] li, [role="listbox"] [role="option"]')
        .should('have.length.greaterThan', 1)
        .first()
        .should('have.text', 'All');

      closeListbox();
      orgFiltersButton().click();
    });

    it('should filter table by G DEPARTMENT selection and update filter badge count', () => {
      orgFiltersButton().click();

      orgSelect('G DEPARTMENT').click();
      cy.get('[role="listbox"]').contains('li, [role="option"]', 'TAY').click();

      cy.wait('@getGuarantors', { timeout: 20000 }).its('request.url').should('include', 'g_dept=TAY');
      orgFiltersButton().should('contain.text', 'Org Filters (1)');
      clearAllButton().should('be.enabled');
      tableRows().should('have.length.greaterThan', 0);

      // Reset filter
      clearAllButton().click();
      cy.wait('@getGuarantors');
      orgFiltersButton().should('have.text', 'Org Filters');
      orgSelect('G DEPARTMENT').should('have.text', 'All');
      assertDefaultTable();
    });
  });

  // =========================================================================
  // 6. Global Clear Button
  // =========================================================================
  describe('Global Clear Button', () => {

    it('should be disabled by default and become enabled when any filter is populated', () => {
      clearAllButton().should('be.disabled');

      guarantorNameInput().type('Somchai');
      clearAllButton().should('be.enabled');

      guarantorNameInput().clear();
      clearAllButton().should('be.disabled');
    });

    it('should reset all search inputs, Org Filters, and reload default records', () => {
      guarantorNameInput().type('Khammai');
      phoneInput().type('02094859613');
      contractInput().type('2086080');

      orgFiltersButton().click();
      orgSelect('G DEPARTMENT').click();
      cy.get('[role="listbox"]').contains('li, [role="option"]', 'LING-F').click();
      cy.wait('@getGuarantors');

      clearAllButton().should('be.enabled').click();
      cy.wait('@getGuarantors');

      guarantorNameInput().should('have.value', '');
      phoneInput().should('have.value', '');
      contractInput().should('have.value', '');
      orgSelect('G DEPARTMENT').should('have.text', 'All');
      orgFiltersButton().should('have.text', 'Org Filters');
      clearAllButton().should('be.disabled');

      assertDefaultTable();
    });
  });

  // =========================================================================
  // 7. Guarantor Details Modal Dialog
  // =========================================================================
  describe('Guarantor Details Modal Dialog', () => {

    it('should open modal on clicking View action and display matching Guarantor ID & Contract No', () => {
      tableRows().first().within(() => {
        cy.get('td').eq(COL['LMS Guarantor ID']).invoke('text').then((id) => {
          cy.wrap(id.trim()).as('expectedId');
        });

        cy.get('td').eq(COL['Contract No']).invoke('text').then((contract) => {
          cy.wrap(contract.trim()).as('expectedContract');
        });

        cy.get('button[aria-label="View"], svg[data-testid="VisibilityIcon"]').first().click();
      });

      dialog().should('be.visible').within(() => {
        cy.contains(exact('Guarantor Details')).should('be.visible');
        cy.contains(exact('GUARANTOR INFORMATION')).should('be.visible');

        cy.get('@expectedId').then((expectedId) => {
          cy.contains(new RegExp(expectedId)).should('be.visible');
        });

        cy.get('@expectedContract').then((expectedContract) => {
          cy.contains(new RegExp(expectedContract)).should('be.visible');
        });

        cy.get('button[aria-label="close"]').click();
      });
      dialog().should('not.exist');
    });

    it('should render all expected guarantor information fields inside the modal', () => {
      tableRows().first().find('button[aria-label="View"], svg[data-testid="VisibilityIcon"]').first().click();

      dialog().should('be.visible').within(() => {
        MODAL_DETAIL_FIELDS.forEach((fieldName) => {
          cy.contains(exact(fieldName)).should('be.visible');
        });
        cy.get('button[aria-label="close"]').click();
      });
      dialog().should('not.exist');
    });

    it('should close the modal when clicking the close (X) button', () => {
      tableRows().first().find('button[aria-label="View"], svg[data-testid="VisibilityIcon"]').first().click();
      dialog().should('be.visible');

      dialog().find('button[aria-label="close"]').click();
      dialog().should('not.exist');
    });

    it('should close the modal on pressing the Escape key', () => {
      tableRows().first().find('button[aria-label="View"], svg[data-testid="VisibilityIcon"]').first().click();
      dialog().should('be.visible');

      cy.get('body').type('{esc}');
      dialog().should('not.exist');
    });
  });

  // =========================================================================
  // 8. Pagination Controls
  // =========================================================================
  describe('Pagination Controls', () => {

    it('should show page 1 as active and disable Previous button on initial load', () => {
      currentPageButton().should('have.text', '1');
      prevButton().should('be.disabled');
      nextButton().should('be.enabled');
    });

    it('should navigate to next page and allow navigating back with Previous button', () => {
      tableRows().first().find('td').eq(COL['LMS Guarantor ID']).invoke('text').then((firstRowPage1) => {
        interceptListWith({ page: '2' }, 'getPage2');
        nextButton().scrollIntoView().click();

        cy.wait('@getPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        currentPageButton().should('have.text', '2');
        prevButton().should('be.enabled');

        // Confirm new records are loaded
        tableRows().first().find('td').eq(COL['LMS Guarantor ID']).should('not.have.text', firstRowPage1);

        // Click Previous to go back to page 1
        interceptListWith({ page: '1' }, 'getPage1');
        prevButton().click();

        cy.wait('@getPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        currentPageButton().should('have.text', '1');
        prevButton().should('be.disabled');
        tableRows().first().find('td').eq(COL['LMS Guarantor ID']).should('have.text', firstRowPage1);
      });
    });

    it('should navigate directly to page 2 when page 2 number button is clicked', () => {
      interceptListWith({ page: '2' }, 'getPage2Direct');

      cy.get('button').filter((i, el) => el.textContent.trim() === '2').scrollIntoView().click();

      cy.wait('@getPage2Direct', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
      currentPageButton().should('have.text', '2');
      prevButton().should('be.enabled');
    });

    it('should reset pagination to page 1 when a new search filter is applied from page 2', () => {
      // Go to page 2 and wait for the specific page 2 request
      interceptListWith({ page: '2' }, 'goToPage2');
      nextButton().scrollIntoView().click();
      cy.wait('@goToPage2', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
      currentPageButton().should('have.text', '2');

      // Filter by name - should request page 1
      interceptListWith({ page: '1', guarantor_name: 'Khammai' }, 'filteredPage1');
      guarantorNameInput().type('Khammai{enter}');

      cy.wait('@filteredPage1', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
      currentPageButton().should('have.text', '1');
    });
  });
});
