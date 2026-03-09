const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

function formatBalance(value) {
  return Number(value).toFixed(2).padStart(9, '0');
}

function parseAmount(rawValue) {
  const parsed = Number(String(rawValue).trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

class DataProgram {
  constructor() {
    this.storageBalance = 1000.0;
  }

  execute(passedOperation, balance) {
    const operationType = String(passedOperation);

    if (operationType === 'READ') {
      return this.storageBalance;
    }

    if (operationType === 'WRITE') {
      this.storageBalance = Number(balance);
      return this.storageBalance;
    }

    return balance;
  }
}

class Operations {
  constructor(dataProgram) {
    this.dataProgram = dataProgram;
    this.finalBalance = 1000.0;
  }

  async execute(passedOperation, rl) {
    const operationType = String(passedOperation);

    if (operationType === 'TOTAL ') {
      this.finalBalance = this.dataProgram.execute('READ', this.finalBalance);
      console.log(`Current balance: ${formatBalance(this.finalBalance)}`);
      return;
    }

    if (operationType === 'CREDIT') {
      const rawAmount = await rl.question('Enter credit amount: ');
      const amount = parseAmount(rawAmount);

      if (amount === null) {
        console.log('Invalid amount entered.');
        return;
      }

      this.finalBalance = this.dataProgram.execute('READ', this.finalBalance);
      this.finalBalance += amount;
      this.dataProgram.execute('WRITE', this.finalBalance);
      console.log(`Amount credited. New balance: ${formatBalance(this.finalBalance)}`);
      return;
    }

    if (operationType === 'DEBIT ') {
      const rawAmount = await rl.question('Enter debit amount: ');
      const amount = parseAmount(rawAmount);

      if (amount === null) {
        console.log('Invalid amount entered.');
        return;
      }

      this.finalBalance = this.dataProgram.execute('READ', this.finalBalance);

      if (this.finalBalance >= amount) {
        this.finalBalance -= amount;
        this.dataProgram.execute('WRITE', this.finalBalance);
        console.log(`Amount debited. New balance: ${formatBalance(this.finalBalance)}`);
      } else {
        console.log('Insufficient funds for this debit.');
      }
    }
  }
}

class MainProgram {
  constructor(operations, createInterface = null) {
    this.operations = operations;
    this.continueFlag = 'YES';
    this.createInterface =
      createInterface || (() => readline.createInterface({ input, output }));
  }

  async run() {
    const rl = this.createInterface();

    try {
      while (this.continueFlag !== 'NO') {
        console.log('--------------------------------');
        console.log('Account Management System');
        console.log('1. View Balance');
        console.log('2. Credit Account');
        console.log('3. Debit Account');
        console.log('4. Exit');
        console.log('--------------------------------');

        const userChoice = (await rl.question('Enter your choice (1-4): ')).trim();

        if (userChoice === '1') {
          await this.operations.execute('TOTAL ', rl);
        } else if (userChoice === '2') {
          await this.operations.execute('CREDIT', rl);
        } else if (userChoice === '3') {
          await this.operations.execute('DEBIT ', rl);
        } else if (userChoice === '4') {
          this.continueFlag = 'NO';
        } else {
          console.log('Invalid choice, please select 1-4.');
        }
      }

      console.log('Exiting the program. Goodbye!');
    } finally {
      rl.close();
    }
  }
}

async function runApp() {
  const dataProgram = new DataProgram();
  const operations = new Operations(dataProgram);
  const mainProgram = new MainProgram(operations);
  await mainProgram.run();
}

if (require.main === module) {
  runApp().catch((error) => {
    console.error('Unexpected application error:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  DataProgram,
  Operations,
  MainProgram,
  runApp,
  formatBalance,
  parseAmount,
};
