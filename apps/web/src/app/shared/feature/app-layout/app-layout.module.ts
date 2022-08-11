import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AppLayoutComponent } from "./app-layout.component";

@NgModule({
  declarations: [AppLayoutComponent],
  imports: [CommonModule, RouterModule],
  exports: [AppLayoutComponent],
})
export class AppLayoutModule {}
