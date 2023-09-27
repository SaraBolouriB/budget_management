import { $query, $update, Record, StableBTreeMap, match, Result, Service, Principal, Variant, CallResult} from 'azle';
import {User} from './User';
import {Account} from './Account';


const userStorage = new StableBTreeMap<Principal, User>(0, 44, 1024);
const accountStorage = new StableBTreeMap<Principal, Account>(0, 44, 1024);



$update
export function createUser(username: string,): Result<User, string> {
    const user = new User(username);
    userStorage.insert(user.getID(), user);
    return Result.Ok<User, string>(user);
}

$update
export function deleteUser(userID: Principal) : Result<User, Variant<{UserDoesNotExist: Principal}>> {
    const user = userStorage.get(userID);

    return match(user, {
        Some: (user) => {
            user.getAllAccounts().forEach((Account) => {
                accountStorage.remove(Account.getID());
                user.removeAccount(Account);
            });
            userStorage.remove(userID);
            return {
                Ok: user
            }
        },
        None: () => {
            return { 
                Err: {UserDoesNotExist: userID}
            }
        }
    });
}

$update
export function addAccount(userID: Principal, amountOfMoney: number): Result<Account, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            const account = new Account(user,amountOfMoney);
            accountStorage.insert(account.getID(), account);
            user.addAccount(account);

            return {
                Ok: account
            }
        },
        None: () => {
            return {
                Err: {UserDoesNotExist: userID}
            }
        }
    })

}

$update
export function removeAccount(userID: Principal, account: Account): Result<Account, Variant<{AccountDoesNotExist: Principal;
                                                                                             UserDoesNotExist: Principal;}>>
{
    return match(userStorage.get(userID), {
        Some: (owner) => {
            return match(accountStorage.remove(account.getID()), {
                Some: (deletedAccount) => {
                    owner.removeAccount(account);
                    return {
                        Ok: account
                    }
                },
                None: () => {
                    return {
                        Err: {AccountDoesNotExist: account.getID()}
                    }
                }
            })
        },
        None: () => {
            return {
                Err: {UserDoesNotExist: userID}  
            }
        }
    })
}

$update
export function deposit(accountID: Principal, amountOfMoney: number) : Result<number, Variant<{AccountDoesNotExist: Principal}>> {
    return match(accountStorage.get(accountID), {
        Some: (account) => {
            let updatedBalance = account.deposit(amountOfMoney);
            return {
                Ok: updatedBalance
            }
        },
        None: () => {
            return{
                Err: {AccountDoesNotExist: accountID}
            }
        }
    });
}

$update
export function withdraw(accountID: Principal, price: number) : Result<number, Variant<{AccountDoesNotExist: Principal}>> {

    return match(accountStorage.get(accountID), {
        Some: (account) => {
            let updatedBalance = account.withdraw(price);
            return {
                Ok: updatedBalance
            }
        },
        None: () => {
            return {
                Err: {AccountDoesNotExist: accountID}
            }
        }
    });
}

$query
export function getAccountInfo(accountID: Principal): Result<Record<{}>, Variant<{AccountDoesNotExist: Principal}>> {
    return match(accountStorage.get(accountID), {
        Some: (account) => {
            return {
                Ok: account.getAccountInformation()
            }
        },
        None: () => {return {
            Err: {AccountDoesNotExist: accountID}
        }}
    });
};

$query
export function getPersonalInfo(userID: Principal): Result<Record<{}>, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            return {
                Ok: user.getPersonalInformation()
            }
        },
        None: () => {
            return {
                Err: {UserDoesNotExist: userID}
            }
        }
    })
}

$query
export function getTotalBalance(userID: Principal): Result<number, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            const accounts = user.getAllAccounts();
            let totalBalance = 0;
            accounts.forEach((account) => {
                totalBalance += account.getTotalBalance();
            })

            return {
                Ok: totalBalance
            }
        },
        None: () => {
            return {
                Err: {UserDoesNotExist: userID}
            }
        }
    })
}





