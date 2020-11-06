
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable()
export class LfxHeaderService {

    constructor(private auth: AuthService) {
        this.setUserInLFxHeader();
        // this.setCallBackUrl();
    }

    setCallBackUrl() {
        console.log('entered setCallBackUrl');
        const lfHeaderEl: any = document.getElementById('lfx-header');
        if (!lfHeaderEl) {
            return;
        }
        console.log('app setCallBackUrl ', this.auth.auth0Options.callbackUrl);
        lfHeaderEl.callbackurl = this.auth.auth0Options.callbackUrl;
    }

    setUserInLFxHeader(): void {
        const lfHeaderEl: any = document.getElementById('lfx-header');
        if (!lfHeaderEl) {
            return;
        }
        setTimeout(() => {
            this.auth.userProfile$.subscribe((data) => {
                if (data) {
                    lfHeaderEl.authuser = data;
                }
            });
        }, 1500);

    }
}
