/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
// import { ROUTES_PATH } from '../constants/routes.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import Bills from '../containers/Bills.js';
import mockStore from '../__mocks__/store';
import userEvent from '@testing-library/user-event';

import router from '../app/Router.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  // **********************************************************
  // **********************************************************
  // **********************************************************

  // click new bill
  describe('When i click on new bill button', () => {
    test('It should renders new bill page', () => {
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      // console.log('window.localStorage : ', window.localStorage.getItem('user'));

      // récupération et insertion dans le html des composants BillsUI
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // window.onNavigate(ROUTES_PATH.Bills);
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // création d'une fonction simulée
      const handleClickNewBill = jest.fn(() => bills.handleClickNewBill);
      // récupération du composant par son data-id
      const newBillBtn = screen.getByTestId('btn-new-bill');
      // écoute d'un event au click
      newBillBtn.addEventListener('click', handleClickNewBill);
      // simulation d'un click
      userEvent.click(newBillBtn);
      // console.log('1');
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    });
  });

  // get bills in statut pending
  describe('When i get bills', () => {
    test('Then it should render bills', async () => {
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const getBills = jest.fn(() => bills.getBills());
      const value = await getBills();
      expect(getBills).toHaveBeenCalled();
      expect(value.length).toBe(4);
    });
  });

  // click on eye icon from a bill
  describe('When i click on the icon eye from a bill', () => {
    test('A modal should open', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const html = BillsUI({ data: [bills[1]] });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const Store = null;
      const billsClass = new Bills({
        document,
        onNavigate,
        Store,
        localStorage: window.localStorage,
      });

      const modale = document.getElementById('modaleFile');

      $.fn.modal = jest.fn(() => modale.classList.add('show'));

      const handleClickIconEye = jest.fn(() => billsClass.handleClickIconEye);
      const iconEye = screen.getByTestId('icon-eye');

      iconEye.addEventListener('click', handleClickIconEye);

      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();

      expect(modale.classList).toContain('show');
    });

    //Test d'intégration POST
    describe('When the app try to fetch datas from the API', () => {
      describe('When it succeed', () => {
        test('Then it should return an array with the corresponding length', async () => {
          const getSpy = jest.spyOn(mockStore, 'bills');
          const bills = await mockStore.bills();
          expect(getSpy).toHaveBeenCalledTimes(1);
          expect((await bills.list()).length).toBe(4);
        });
      });

      describe('When it fails with a 404 error message', () => {
        test('Then it should display a 404 error message', async () => {
          mockStore.bills.mockImplementationOnce(() => {
            Promise.reject(new Error('Erreur 404'));
          });
          const html = BillsUI({ error: 'Erreur 404' });
          document.body.innerHTML = html;
          const message = screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });
      });

      describe('When it fails with a 500 error message', () => {
        test('Then it should display a 500 error message', async () => {
          mockStore.bills.mockImplementationOnce(() => {
            Promise.reject(new Error('Erreur 500'));
          });
          const html = BillsUI({ error: 'Erreur 500' });
          document.body.innerHTML = html;
          const message = screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
