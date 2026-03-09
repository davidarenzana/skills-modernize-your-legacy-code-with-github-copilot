const {
  DataProgram,
  Operations,
  MainProgram,
  formatBalance,
  parseAmount,
} = require('./index');

function createMockReadline(answers) {
  let index = 0;

  return {
    question: jest.fn(async () => {
      const answer = answers[index] ?? '';
      index += 1;
      return answer;
    }),
    close: jest.fn(),
  };
}

describe('Accounting modernization parity tests', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('TC-001/TC-002: displays menu and exits on option 4', async () => {
    const operations = { execute: jest.fn() };
    const rl = createMockReadline(['4']);
    const main = new MainProgram(operations, () => rl);

    await main.run();

    expect(logSpy).toHaveBeenCalledWith('Account Management System');
    expect(logSpy).toHaveBeenCalledWith('1. View Balance');
    expect(logSpy).toHaveBeenCalledWith('2. Credit Account');
    expect(logSpy).toHaveBeenCalledWith('3. Debit Account');
    expect(logSpy).toHaveBeenCalledWith('4. Exit');
    expect(logSpy).toHaveBeenCalledWith('Exiting the program. Goodbye!');
    expect(operations.execute).not.toHaveBeenCalled();
    expect(rl.close).toHaveBeenCalledTimes(1);
  });

  test('TC-003: invalid menu option shows validation and loops', async () => {
    const operations = { execute: jest.fn() };
    const rl = createMockReadline(['9', '4']);
    const main = new MainProgram(operations, () => rl);

    await main.run();

    expect(logSpy).toHaveBeenCalledWith('Invalid choice, please select 1-4.');
    const menuRenders = logSpy.mock.calls.filter(
      (call) => call[0] === 'Account Management System'
    );
    expect(menuRenders.length).toBeGreaterThanOrEqual(2);
  });

  test('TC-018: menu continues after non-exit operation', async () => {
    const operations = { execute: jest.fn() };
    const rl = createMockReadline(['1', '4']);
    const main = new MainProgram(operations, () => rl);

    await main.run();

    expect(operations.execute).toHaveBeenCalledWith('TOTAL ', rl);
    const menuRenders = logSpy.mock.calls.filter(
      (call) => call[0] === 'Account Management System'
    );
    expect(menuRenders.length).toBeGreaterThanOrEqual(2);
  });

  test('TC-004: initial balance is 1000.00 (formatted)', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('TOTAL ', createMockReadline([]));

    expect(logSpy).toHaveBeenCalledWith('Current balance: 001000.00');
  });

  test('TC-005/TC-006: credit updates and persists balance in-session', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('CREDIT', createMockReadline(['100.00']));
    await operations.execute('TOTAL ', createMockReadline([]));

    expect(data.execute('READ', 0)).toBeCloseTo(1100.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Amount credited. New balance: 001100.00');
    expect(logSpy).toHaveBeenCalledWith('Current balance: 001100.00');
  });

  test('TC-007/TC-008: debit with sufficient funds succeeds and persists', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('DEBIT ', createMockReadline(['50.00']));
    await operations.execute('TOTAL ', createMockReadline([]));

    expect(data.execute('READ', 0)).toBeCloseTo(950.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Amount debited. New balance: 000950.00');
    expect(logSpy).toHaveBeenCalledWith('Current balance: 000950.00');
  });

  test('TC-009/TC-010: debit with insufficient funds is rejected and unchanged', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('DEBIT ', createMockReadline(['999999.99']));
    await operations.execute('TOTAL ', createMockReadline([]));

    expect(logSpy).toHaveBeenCalledWith('Insufficient funds for this debit.');
    expect(data.execute('READ', 0)).toBeCloseTo(1000.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Current balance: 001000.00');
  });

  test('TC-011: sequential transaction flow yields expected final balance', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('CREDIT', createMockReadline(['200.00']));
    await operations.execute('DEBIT ', createMockReadline(['75.00']));
    await operations.execute('TOTAL ', createMockReadline([]));

    expect(data.execute('READ', 0)).toBeCloseTo(1125.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Current balance: 001125.00');
  });

  test('TC-012: balance persistence is runtime-only across new instances', async () => {
    const sessionOne = new DataProgram();
    sessionOne.execute('WRITE', 1300.0);

    const sessionTwo = new DataProgram();
    expect(sessionOne.execute('READ', 0)).toBeCloseTo(1300.0, 2);
    expect(sessionTwo.execute('READ', 0)).toBeCloseTo(1000.0, 2);
  });

  test('TC-013: credit zero amount leaves balance unchanged', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('CREDIT', createMockReadline(['0.00']));

    expect(data.execute('READ', 0)).toBeCloseTo(1000.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Amount credited. New balance: 001000.00');
  });

  test('TC-014: debit zero amount leaves balance unchanged', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('DEBIT ', createMockReadline(['0.00']));

    expect(data.execute('READ', 0)).toBeCloseTo(1000.0, 2);
    expect(logSpy).toHaveBeenCalledWith('Amount debited. New balance: 001000.00');
  });

  test('TC-015: decimal precision updates to two decimal places', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('CREDIT', createMockReadline(['10.25']));
    await operations.execute('TOTAL ', createMockReadline([]));

    expect(data.execute('READ', 0)).toBeCloseTo(1010.25, 2);
    expect(logSpy).toHaveBeenCalledWith('Current balance: 001010.25');
  });

  test('TC-016: non-numeric amount is rejected in Node implementation', async () => {
    const data = new DataProgram();
    const operations = new Operations(data);

    await operations.execute('CREDIT', createMockReadline(['ABC']));

    expect(logSpy).toHaveBeenCalledWith('Invalid amount entered.');
    expect(data.execute('READ', 0)).toBeCloseTo(1000.0, 2);
  });

  test('TC-017: negative amount behavior is captured for migration parity', async () => {
    const creditData = new DataProgram();
    const creditOps = new Operations(creditData);
    await creditOps.execute('CREDIT', createMockReadline(['-50']));
    expect(creditData.execute('READ', 0)).toBeCloseTo(950.0, 2);

    const debitData = new DataProgram();
    const debitOps = new Operations(debitData);
    await debitOps.execute('DEBIT ', createMockReadline(['-50']));
    expect(debitData.execute('READ', 0)).toBeCloseTo(1050.0, 2);
  });

  test('utility behavior: formatBalance and parseAmount', () => {
    expect(formatBalance(1000)).toBe('001000.00');
    expect(parseAmount(' 10.25 ')).toBe(10.25);
    expect(parseAmount('ABC')).toBeNull();
  });
});
