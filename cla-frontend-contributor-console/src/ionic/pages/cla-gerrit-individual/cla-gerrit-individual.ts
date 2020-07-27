// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage } from 'ionic-angular';
import { ClaService } from '../../services/cla.service';
import { RolesService } from '../../services/roles.service';
import { AuthService } from '../../services/auth.service';
import { Restricted } from '../../decorators/restricted';

@Restricted({
  roles: ['isAuthenticated']
})
@IonicPage({
  segment: 'cla/gerrit/project/:projectId/individual'
})
@Component({
  selector: 'cla-gerrit-individual',
  templateUrl: 'cla-gerrit-individual.html'
})
export class ClaGerritIndividualPage {
  projectId: string;
  project: any;
  userId: string;
  user: any;
  signatureIntent: any;
  activeSignatures: boolean = true; // we assume true until otherwise
  signature: any;
  userRoles: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private claService: ClaService,
    private rolesService: RolesService,
    private authService: AuthService,
  ) {
    this.getDefaults();
    this.projectId = navParams.get('projectId');
    localStorage.setItem('projectId', this.projectId);
    localStorage.setItem('gerritClaType', 'ICLA');
  }

  getDefaults() {
    this.userRoles = this.rolesService.userRoleDefaults;

    this.project = {
      project_name: ''
    };
    this.signature = {
      sign_url: ''
    };
  }

  ngOnInit() {
    this.getProjectDetails();
  }

  ionViewCanEnter() {
    if (!this.authService.isAuthenticated) {
      setTimeout(() => this.navCtrl.setRoot('LoginPage'));
    }
    return this.authService.isAuthenticated;
  }

  ngAfterViewInit() { }

  getProjectDetails() {
    //retrieve project info with project Id
    this.claService.getProjectWithAuthToken(this.projectId).subscribe((project) => {
      this.project = project;

      // retrieve userInfo from auth0 service
      this.claService.postOrGetUserForGerrit().subscribe((user) => {
        this.userId = user.user_id;

        // get signatureIntent object, similar to the Github flow.
        this.postSignatureRequest();
      });
    });
  }

  postSignatureRequest() {
    let signatureRequest = {
      project_id: this.projectId,
      user_id: this.userId,
      return_url_type: 'Gerrit'
    };
    this.claService.postIndividualSignatureRequest(signatureRequest).subscribe((response) => {
      this.signature = response;
    });
  }

  openClaAgreement() {
    if (!this.signature.sign_url) {
      return;
    }
    window.open(this.signature.sign_url, '_self');
  }
}
