// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AuthService } from '../../services/auth.service';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'page-auth',
  templateUrl: 'auth.html'
})
export class AuthPage {
  userRoles: any;
  projectId: string;
  claType: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public authService: AuthService,
    public rolesService: RolesService
  ) {
    this.projectId = localStorage.getItem('projectId');
    this.claType = localStorage.getItem('gerritClaType');
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.rolesService
        .getUserRolesPromise()
        .then((userRoles) => {
          if (userRoles.isAuthenticated) {
            if (this.claType == 'ICLA') {
              this.navCtrl.setRoot('ClaGerritIndividualPage', { projectId: this.projectId });
            } else if (this.claType == 'CCLA') {
              this.navCtrl.setRoot('ClaGerritCorporatePage', { projectId: this.projectId });
            }
            localStorage.removeItem('projectId');
            localStorage.removeItem('gerritClaType');
          } else {
            this.navCtrl.setRoot('LoginPage');
          }
        })
        .catch((error) => {
          this.navCtrl.setRoot('LoginPage');
        });
    }, 2000);
  }
}
