import { $query, $update, Record, StableBTreeMap, match, Result, Principal, Variant, nat, Vec} from 'azle';

type User = Record<{
    id: Principal;
    username: string;
    accountsID: Vec<Principal>
}>;

type Account = Record<{
    id: Principal;
    owner: Principal;
    totalBalance: number;
    totalExpenses: number;
}>;


const userStorage = new StableBTreeMap<Principal, User>(0, 44, 1024);
const accountStorage = new StableBTreeMap<Principal, Account>(1, 44, 1024);


function generateId(): Principal {
    const randomBytes = new Array(29)
        .fill(0)
        .map((_) => Math.floor(Math.random() * 256));

    return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}


$update
export function createUser(username: string,): Result<User, string> {
    const userID = generateId();
    const user : User = {
        id: userID,
        username: username,
        accountsID: []
    }
    userStorage.insert(user.id, user);
    return Result.Ok<User, string>(user);
}

$update
export function deleteUser(userID: Principal) : Result<User, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            user.accountsID.forEach((account) => {
                accountStorage.remove(account);
            });
            userStorage.remove(user.id);
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

//PROBLEM
$update
export function addAccount(userID: Principal, amountOfMoney: number): Result<Account, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            const account: Account = {
                id: generateId(),
                owner: user.id,
                totalBalance: amountOfMoney,
                totalExpenses: 0
            }
            const userUpdate: User = {
                ...user,
                accountsID: [...user.accountsID, account.id]
            }
            userStorage.insert(userUpdate.id, userUpdate);

            accountStorage.insert(account.id, account);

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
export function removeAccount(userID: Principal, accountID: Principal): Result<Account, Variant<{AccountDoesNotExist: Principal;
                                                                                             UserDoesNotExist: Principal;}>>
{
    return match(userStorage.get(userID), {
        Some: (user) => {
            return match(accountStorage.get(accountID), {
                Some: (deletedAccount) => {
                    const updateUser: User = {
                        ...user,
                        accountsID: user.accountsID.filter((accountsID) => 
                            accountsID.toText() !== deletedAccount.id.toText()
                        )
                    }
                    userStorage.insert(updateUser.id, updateUser);
                    accountStorage.remove(deletedAccount.id);

                    return {
                        Ok: deletedAccount
                    }
                },
                None: () => {
                    return {
                        Err: {AccountDoesNotExist: accountID}
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
            const updateAccount: Account = {
                ...account,
                totalBalance: account.totalBalance + amountOfMoney
            }
            accountStorage.insert(updateAccount.id, updateAccount);

            return {
                Ok: updateAccount.totalBalance
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
            const updateAccount: Account = {
                ...account,
                totalBalance: account.totalBalance - price,
                totalExpenses: account.totalExpenses + price
            }
            accountStorage.insert(updateAccount.id, updateAccount);

            return {
                Ok: updateAccount.totalBalance
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
export function getTotalBalance(userID: Principal): Result<number, Variant<{UserDoesNotExist: Principal, 
                                                                            AccountDoesNotExist: Principal}>>
{
    return match(userStorage.get(userID), {
        Some: (user) => {

            let totalBalance: number = 0;
            user.accountsID.forEach((accountId) => {
                return match(accountStorage.get(accountId), {
                    Some: (account) => {
                        totalBalance += account.totalBalance;
                    },
                    None: () => {
                        return {
                            Err: {AccountDoesNotExist: accountId}
                        }
                    }
                })
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

$query
export function getAllAccountInfo(userID: Principal): Result<Vec<Account>, Variant<{AccountDoesNotExist: Principal,
                                                                                    UserDoesNotExist: Principal}>> 
{
    return match(userStorage.get(userID), {
        Some: (user) => {
            let accountsInfo: Vec<Account> = [];
            user.accountsID.forEach((accountid) => {
                return match(accountStorage.get(accountid), {
                    Some: (account) => {
                        accountsInfo.push(account);
                    },
                    None: () => {
                        return {
                            Err: {AccountDoesNotExist: accountid}
                        }
                    }
                })
            })
            return {
                Ok: accountsInfo
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
export function getAccountInfo(accountID: Principal): Result<Account, Variant<{AccountDoesNotExist: Principal}>> {
    return match(accountStorage.get(accountID), {
        Some: (account) => {
            return {
                Ok: account
            }
        },
        None: () => {return {
            Err: {AccountDoesNotExist: accountID}
        }}
    });
};

$query
export function getPersonalInfo(userID: Principal): Result<User, Variant<{UserDoesNotExist: Principal}>> {
    return match(userStorage.get(userID), {
        Some: (user) => {
            return {
                Ok: user
            }
        },
        None: () => {
            return {
                Err: {UserDoesNotExist: userID}
            }
        }
    })
}









