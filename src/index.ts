// Import necessary modules and dependencies.
import { v4 as uuidv4 } from "uuid";
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  match,
  Result,
  Principal,
  Variant,
  nat,
  Vec,
  ic,
} from "azle";

// Define a TypeScript type for a User record.
type User = Record<{
  id: string;
  username: string;
  accountsID: Vec<string>;
}>;

// Define a TypeScript type for an Account record.
type Account = Record<{
  id: string;
  owner: Principal;
  totalBalance: number;
  totalExpenses: number;
}>;

// Create StableBTreeMap instances to store User and Account objects.
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);
const accountStorage = new StableBTreeMap<string, Account>(1, 44, 1024);

// Function to generate a random Principal ID.
function generateId(): Principal {
  const randomBytes = new Array(29)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 256));

  return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to create a new User.
export function createUser(username: string): Result<User, string> {
  if (username === "") {
    return Result.Err<User, string>("Username cannot be empty");
  }

  // Check if the username already exists.
  const existingUser = userStorage
    .values()
    .find((user) => user.username === username);
  if (existingUser) {
    return Result.Err<User, string>("Username already exists");
  }

  // Generate a unique User ID.
  const userID = uuidv4();
  const user: User = {
    id: userID,
    username: username,
    accountsID: [],
  };

  try {
    // Insert the new User into storage.
    userStorage.insert(user.id, user);
  } catch (error) {
    return Result.Err<User, string>("Error inserting user into storage");
  }

  return Result.Ok<User, string>(user);
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to delete a User by their ID.
export function deleteUser(userID: string): Result<User, string> {
  try {
    return match(userStorage.get(userID), {
      Some: (existingUser) => {
        // Remove the User from storage.
        userStorage.remove(userID);
        return Result.Ok<User, string>(existingUser);
      },
      None: () => Result.Err<User, string>(`User with id=${userID} not found.`),
    });
  } catch (error) {
    return Result.Err<User, string>(
      `An error occurred while deleting user with id=${userID}.`
    );
  }
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to add a new Account.
export function addAccount(
  userID: string,
  amountOfMoney: number
): Result<Account, string> {
  if (typeof userID !== "string") {
    return Result.Err<Account, string>("userID must be a valid string.");
  }

  if (amountOfMoney <= 0) {
    return Result.Err<Account, string>(
      "Amount of money must be a positive number."
    );
  }

  return match(userStorage.get(userID), {
    Some: (user) => {
      // Generate a unique Account ID.
      const account: Account = {
        id: uuidv4(),
        owner: ic.caller(),
        totalBalance: amountOfMoney,
        totalExpenses: 0,
      };

      try {
        // Insert the new Account into storage.
        accountStorage.insert(account.id, account);
      } catch (error) {
        return Result.Err<Account, string>(
          "Failed to insert account into storage."
        );
      }

      // Update the User's accountsID with the new Account ID.
      const userUpdate: User = {
        ...user,
        accountsID: [...user.accountsID, account.id],
      };

      try {
        // Update the User in storage.
        userStorage.insert(userUpdate.id, userUpdate);
      } catch (error) {
        return Result.Err<Account, string>(
          "Failed to insert user into storage."
        );
      }

      return Result.Ok<Account, string>(account);
    },
    None: () =>
      Result.Err<Account, string>(`Account with id=${userID} not found.`),
  });
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to remove an Account.
export function removeAccount(
  userID: string,
  accountID: string
): Result<Account, string> {
  return match(userStorage.get(userID), {
    Some: (user) => {
      return match(accountStorage.get(accountID), {
        Some: (deletedAccount) => {
          // Remove the Account from storage.
          accountStorage.remove(deletedAccount.id);

          // Update the User's accountsID to remove the Account ID.
          const updateUser: User = {
            ...user,
            accountsID: user.accountsID.filter(
              (accountsID) => accountsID !== deletedAccount.id
            ),
          };

          try {
            // Update the User in storage.
            userStorage.insert(updateUser.id, updateUser);
          } catch (error) {
            return Result.Err<Account, string>(
              "Failed to insert updatedUser into storage."
            );
          }

          return Result.Ok<Account, string>(deletedAccount);
        },
        None: () =>
          Result.Err<Account, string>(
            `Account with id=${accountID} not found.`
          ),
      });
    },
    None: () =>
      Result.Err<Account, string>(`User with id=${userID} not found.`),
  });
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to deposit money into an Account.
export function deposit(
  accountID: string,
  amountOfMoney: number
): Result<number, string> {
  if (typeof amountOfMoney !== "number") {
    return Result.Err<number, string>(
      "Invalid input: amountOfMoney must be a number."
    );
  }

  if (amountOfMoney <= 0) {
    return Result.Err<number, string>(
      "Amount of money must be greater than 0."
    );
  }

  return match(accountStorage.get(accountID), {
    Some: (account) => {
      // Update the Account's totalBalance.
      const updateAccount: Account = {
        ...account,
        totalBalance: account.totalBalance + amountOfMoney,
      };

      try {
        // Insert the updated Account into storage.
        accountStorage.insert(updateAccount.id, updateAccount);
      } catch (error) {
        return Result.Err<number, string>(
          "Failed to insert updatedAccount into storage."
        );
      }

      return Result.Ok<number, string>(updateAccount.totalBalance);
    },
    None: () =>
      Result.Err<number, string>(
        `Account with id=${accountID} does not exist.`
      ),
  });
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to withdraw money from an Account.
export function withdraw(
  accountID: string,
  price: number
): Result<number, string> {
  if (price <= 0) {
    return Result.Err<number, string>("Price must be a positive number.");
  }

  return match(accountStorage.get(accountID), {
    Some: (account) => {
      if (price <= account.totalBalance) {
        // Update the Account's totalBalance and totalExpenses.
        const updateAccount: Account = {
          ...account,
          totalBalance: account.totalBalance - price,
          totalExpenses: account.totalExpenses + price,
        };

        // Insert the updated Account into storage.
        accountStorage.insert(updateAccount.id, updateAccount);

        return Result.Ok<number, string>(updateAccount.totalBalance);
      } else {
        return Result.Err<number, string>(
          `The price is more than your balance. The totalBalance is ${account.totalBalance}`
        );
      }
    },
    None: () =>
      Result.Err<number, string>(
        `Account with id=${accountID} does not exist.`
      ),
  });
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to get the total balance of a User's accounts.
export function getTotalBalance(userID: string): Result<number, string> {
  return match(userStorage.get(userID), {
    Some: (user) => {
      let totalBalance: number = 0;
      user.accountsID.forEach((accountId) => {
        return match(accountStorage.get(accountId), {
          Some: (account) => {
            // Sum up the total balances of all user's accounts.
            totalBalance += account.totalBalance;
          },
          None: () => Result.Err<number, string>(`Account does not exist.`),
        });
      });

      return Result.Ok<number, string>(totalBalance);
    },
    None: () =>
      Result.Err<number, string>(`User with id=${userID} does not exist.`),
  });
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to get all account information for a User.
export function getAllAccountInfo(
  userID: string
): Result<Vec<Account>, string> {
  if (!userID) {
    return Result.Err<Vec<Account>, string>(`Invalid userID.`);
  }

  return match(userStorage.get(userID), {
    Some: (user) => {
      if (user.accountsID.length === 0) {
        return Result.Err<Vec<Account>, string>(
          `User with id=${userID} has no accounts.`
        );
      }
      let accountsInfo: Vec<Account> = [];
      user.accountsID.forEach((accountid) => {
        return match(accountStorage.get(accountid), {
          Some: (account) => {
            // Collect account information.
            accountsInfo = [...accountsInfo, account];
          },
          None: () =>
            Result.Err<Vec<Account>, string>(`Account does not exist.`),
        });
      });
      return Result.Ok<Vec<Account>, string>(accountsInfo);
    },
    None: () =>
      Result.Err<Vec<Account>, string>(
        `User with id=${userID} does not exist.`
      ),
  });
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to get account information by Account ID.
export function getAccountInfo(
  accountID: string
): Result<Account, Variant<{ AccountDoesNotExist: string }>> {
  return match(accountStorage.get(accountID), {
    Some: (account) => {
      return {
        Ok: account,
      };
    },
    None: () => {
      return {
        Err: { AccountDoesNotExist: accountID },
      };
    },
  });
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to get user information by User ID.
export function getPersonalInfo(
  userID: string
): Result<User, Variant<{ UserDoesNotExist: string }>> {
  return match(userStorage.get(userID), {
    Some: (user) => {
      return {
        Ok: user,
      };
    },
    None: () => {
      return {
        Err: { UserDoesNotExist: userID },
      };
    },
  });
}

// Define a global crypto object with a getRandomValues method.
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
