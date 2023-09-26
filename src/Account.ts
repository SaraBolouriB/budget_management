
import { Record, Result, Principal } from 'azle';
import {User} from './User';


type AccountInfo = Record<{
    owner: User;
    totalBalance: number
}>;

export class Account {

    private id: Principal;
    private owner: User;
    private totalBalance: number;
    private totalExpenses: number;
    
    public constructor(owner: User, amountOfMoney: number){
        this.id = this.generateId();
        this.owner = owner;
        this.totalBalance = amountOfMoney;
        this.totalExpenses = 0.0;
    }

    public getTotalExpenses() : number {
        return this.totalExpenses;
    }

    public getTotalBalance() : number {
        return this.totalBalance;
    }

    public getID() : Principal {
        return this.id;
    }

    public getAccountInformation() : Result<AccountInfo, string> {
        const accountlInfo : AccountInfo = {owner: this.owner, totalBalance: this.totalBalance};
        return Result.Ok(accountlInfo);

    }

    public deposit(amountOfMoney: number) : number {
        this.totalBalance += amountOfMoney;
        return this.totalBalance;
    }

    public withdraw(price: number) : number {
        this.totalBalance -= price;
        this.totalExpenses += price;
        return this.totalBalance;
    }
    
    public transfer(to: Account, amount: number) : number {
        this.totalBalance -= amount;
        to.deposit(amount);
        return this.totalBalance;
    }

    private generateId(): Principal {
        const randomBytes = new Array(29)
            .fill(0)
            .map((_) => Math.floor(Math.random() * 256));
    
        return Principal.fromUint8Array(Uint8Array.from(randomBytes));
    }
}
