// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { AuthService } from '../../services/auth.service';
import { EnvConfig } from '../../services/cla.env.utils';
import { RolesService } from '../../services/roles.service';

/**
 * Generated class for the AuthPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@Component({
  selector: 'page-auth',
  templateUrl: 'auth.html'
})
export class AuthPage {
  userRoles: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public authService: AuthService,
    public rolesService: RolesService
  ) { }

  ionViewDidEnter() {
    // console.log('token ' + this.navParams.get('idToken'))
    // setTimeout(() => {
    //   this.rolesService
    //     .getUserRolesPromise()
    //     .then((userRoles) => {
    //       if (AuthPage.hasAccess(userRoles)) {
    //         this.navCtrl.setRoot('CompaniesPage');
    //       } else {
    //         this.redirectToLogin();
    //       }
    //     })
    //     .catch((error) => {
    //       this.redirectToLogin();
    //     });
    // }, 2000);
    if (this.authService.isAuthenticated()) {
      this.navCtrl.setRoot('CompaniesPage');
    } else {
      this.redirectToLogin();
    }
  }

  redirectToLogin() {
    if (EnvConfig['lfx-header-enabled'] === "true") {
      window.open(EnvConfig['landing-page'], '_self');
    } else {
      this.navCtrl.setRoot('LoginPage');
    }
  }
}
