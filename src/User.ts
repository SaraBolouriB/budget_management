import { Result, Record, Principal} from 'azle';
import {Account} from './Account';

type personalInfo = Record<{
    id: Principal,
    username: string,
}>;

interface user {
    getID: () => Principal;
    getAllAccounts: () => Account[];
    getPersonalInformation: () => Result<Record<{}>, string>;
    addAccount: (account: Account) => Result<string, string>;
    removeAccount: (account: Account) => Result<string, string>;
}

export class User implements user{
    private id: Principal;
    private username: string;
    private accounts: Account[];

    

    public constructor(username: string) {
        this.id = this.generateId();
        this.username = username;
    }

    public getID(): Principal {
        return this.id;
    }

    public getAllAccounts(): Account[] {
        return this.accounts;
    }

    public getPersonalInformation(): Result<Record<{}>, string> {

        const pi : personalInfo = {
            id: this.id,
            username: this.username, 
        }
        return Result.Ok<Record<{}>, string>(pi);
    }

    public addAccount(acount: Account): Result<string, string> {
        this.accounts.push(acount);
        return Result.Ok<string, string>('Adding the bank account with id number =${account.getID()} has been done successfully.');
    }

    public removeAccount(account: Account): Result<string, string> {
        let accountIndex = this.accounts.indexOf(account);
        this.accounts.splice(accountIndex, 1);
        return Result.Ok<string, string>('Removing account has been done successfuly.');
    }

    private generateId(): Principal {
        const randomBytes = new Array(29)
            .fill(0)
            .map((_) => Math.floor(Math.random() * 256));
    
        return Principal.fromUint8Array(Uint8Array.from(randomBytes));
    }
}