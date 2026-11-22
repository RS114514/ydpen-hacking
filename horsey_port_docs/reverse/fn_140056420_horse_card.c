=== FUNC 140056420 FUN_140056420 ===
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_140056420(longlong param_1)

{
  uint *puVar1;
  undefined4 *puVar2;
  float fVar3;
  float fVar4;
  undefined4 uVar5;
  float fVar6;
  float fVar7;
  float fVar8;
  char cVar9;
  undefined8 *puVar10;
  int *piVar11;
  undefined8 uVar12;
  undefined8 *puVar13;
  longlong lVar14;
  undefined8 uVar15;
  float *pfVar16;
  int iVar17;
  int iVar18;
  uint uVar19;
  ulonglong uVar20;
  ulonglong uVar21;
  ulonglong uVar22;
  float fVar23;
  float fVar24;
  longlong local_res8;
  undefined4 local_res10 [2];
  undefined8 in_stack_fffffffffffffef8;
  undefined4 uVar25;
  undefined4 uVar26;
  undefined8 local_e8;
  undefined8 uStack_e0;
  undefined8 local_d8;
  ulonglong local_d0;
  
  uVar25 = (undefined4)((ulonglong)in_stack_fffffffffffffef8 >> 0x20);
  local_res8 = param_1;
  FUN_1400c3f10(DAT_1402e8b04);
  FUN_1400c41b0();
  fVar8 = DAT_1402bc554;
  iVar18 = 0xd2;
  do {
    FUN_1400c41b0();
    iVar18 = iVar18 + 0x10;
  } while (iVar18 < 0x132);
  iVar18 = 0x21;
  do {
    FUN_1400c41b0();
    iVar18 = iVar18 + 0x10;
  } while (iVar18 < 0x91);
  if (*(char *)(param_1 + 0x279) != '\0') {
    FUN_1400c8460();
    uVar12 = CONCAT44(uVar25,*(undefined4 *)(param_1 + 0x26c));
    FUN_1400d9e40(param_1,*(longlong *)(param_1 + 0x270) + 0x2b8,*(undefined4 *)(param_1 + 0x27c),
                  fVar8,uVar12);
    uVar25 = (undefined4)((ulonglong)uVar12 >> 0x20);
    FUN_1400c86d0();
  }
  if (*(int *)(*(longlong *)(param_1 + 0x270) + 0x1f8) == -1) {
    return;
  }
  puVar10 = (undefined8 *)FUN_1400c03d0();
  piVar11 = (int *)&DAT_1402ec520;
  if (0xf < DAT_1402ec538) {
    piVar11 = DAT_1402ec520;
  }
  if ((((DAT_1402ec530 == 5) && (*piVar11 == 0x74656544)) && ((char)piVar11[1] == 's')) &&
     (*(int *)((longlong)puVar10 + 0x5c) != 2)) {
    puVar1 = (uint *)(*(longlong *)(param_1 + 0x270) + 600);
    *puVar1 = *puVar1 | 1;
    *(undefined4 *)(*(longlong *)(param_1 + 0x270) + 0x1fc) = 3;
    *(undefined4 *)(puVar10 + 10) = 5;
    *(undefined4 *)((longlong)puVar10 + 0x54) = 1;
    *(undefined4 *)((longlong)puVar10 + 0x5c) = 2;
    *(undefined1 *)((longlong)puVar10 + 99) = 1;
    uVar12 = FUN_1400c0410(&local_e8);
    FUN_1400c07c0(3,uVar12);
    if (0xf < local_d0) {
      if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
        _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
      }
      thunk_FUN_14023e310();
    }
    uVar12 = FUN_1400c0410(&local_e8);
    FUN_1400c07c0(4,uVar12);
    if (0xf < local_d0) {
      if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
        _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
      }
      thunk_FUN_14023e310();
    }
    uVar12 = FUN_1400c0410(&local_e8);
    FUN_1400c07c0(0x11,uVar12);
    if (0xf < local_d0) {
      if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
        _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
      }
      thunk_FUN_14023e310();
    }
    *(undefined4 *)(puVar10 + 9) = 3;
    *(undefined4 *)((longlong)puVar10 + 0x4c) = 4;
    local_res10[0] = 0x11;
    puVar2 = (undefined4 *)puVar10[0xf];
    if (puVar2 == (undefined4 *)puVar10[0x10]) {
      FUN_140057860(puVar10 + 0xe,puVar2,local_res10);
    }
    else {
      *puVar2 = 0x11;
      puVar10[0xf] = puVar10[0xf] + 4;
    }
  }
  lVar14 = *(longlong *)(param_1 + 0x60);
  if (*(int *)(param_1 + 0xd8) == 8) {
    FUN_1400c41b0();
  }
  fVar23 = DAT_140258f5c;
  puVar13 = puVar10;
  if (0xf < (ulonglong)puVar10[3]) {
    puVar13 = (undefined8 *)*puVar10;
  }
  uVar12 = CONCAT44(uVar25,fVar8);
  FUN_14007f0f0(DAT_14030e518,puVar13,DAT_14025a7b8,0,uVar12,
                *(undefined4 *)(&DAT_14030ae80 + (longlong)*(int *)((longlong)puVar10 + 0x44) * 4),
                puVar13);
  cVar9 = FUN_140086700();
  fVar6 = DAT_1402586fc;
  if (((cVar9 != '\0') && (DAT_14030dc84 % 0x1e < 0xf)) || (*(int *)(param_1 + 0xd8) == 8)) {
    uVar12 = CONCAT44((int)((ulonglong)uVar12 >> 0x20),DAT_1402e8a70);
    FUN_1400c41b0(*(float *)(lVar14 + 0x37c) + fVar23);
  }
  lVar14 = *(longlong *)((longlong)ThreadLocalStoragePointer + (ulonglong)_tls_index * 8);
  if ((*(int *)(lVar14 + 4) < DAT_14030aec4) && (FUN_14021b200(&DAT_14030aec4), DAT_14030aec4 == -1)
     ) {
    local_d8 = 10;
    local_d0 = 0xf;
    local_e8._0_1_ = s_StatusFoal_14025a728[0];
    local_e8._1_1_ = s_StatusFoal_14025a728[1];
    local_e8._2_1_ = s_StatusFoal_14025a728[2];
    local_e8._3_1_ = s_StatusFoal_14025a728[3];
    local_e8._4_1_ = s_StatusFoal_14025a728[4];
    local_e8._5_1_ = s_StatusFoal_14025a728[5];
    local_e8._6_1_ = s_StatusFoal_14025a728[6];
    local_e8._7_1_ = s_StatusFoal_14025a728[7];
    uStack_e0 = (ulonglong)(ushort)s_StatusFoal_14025a728._8_2_;
    DAT_14030aec0 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aec4);
  }
  if ((*(int *)(lVar14 + 4) < DAT_14030aecc) && (FUN_14021b200(&DAT_14030aecc), DAT_14030aecc == -1)
     ) {
    local_d8 = 10;
    local_d0 = 0xf;
    local_e8._0_1_ = s_ItemTrophy_14025a738[0];
    local_e8._1_1_ = s_ItemTrophy_14025a738[1];
    local_e8._2_1_ = s_ItemTrophy_14025a738[2];
    local_e8._3_1_ = s_ItemTrophy_14025a738[3];
    local_e8._4_1_ = s_ItemTrophy_14025a738[4];
    local_e8._5_1_ = s_ItemTrophy_14025a738[5];
    local_e8._6_1_ = s_ItemTrophy_14025a738[6];
    local_e8._7_1_ = s_ItemTrophy_14025a738[7];
    uStack_e0 = (ulonglong)(ushort)s_ItemTrophy_14025a738._8_2_;
    DAT_14030aec8 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aecc);
  }
  uVar22 = 0;
  if ((*(int *)(lVar14 + 4) < DAT_14030aed4) && (FUN_14021b200(&DAT_14030aed4), DAT_14030aed4 == -1)
     ) {
    local_d8 = 0xb;
    local_d0 = 0xf;
    local_e8._0_1_ = s_ItemRibbon1_14025a748[0];
    local_e8._1_1_ = s_ItemRibbon1_14025a748[1];
    local_e8._2_1_ = s_ItemRibbon1_14025a748[2];
    local_e8._3_1_ = s_ItemRibbon1_14025a748[3];
    local_e8._4_1_ = s_ItemRibbon1_14025a748[4];
    local_e8._5_1_ = s_ItemRibbon1_14025a748[5];
    local_e8._6_1_ = s_ItemRibbon1_14025a748[6];
    local_e8._7_1_ = s_ItemRibbon1_14025a748[7];
    uStack_e0 = (ulonglong)CONCAT12(s_ItemRibbon1_14025a748[10],s_ItemRibbon1_14025a748._8_2_);
    DAT_14030aed0 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aed4);
  }
  if ((*(int *)(lVar14 + 4) < DAT_14030aedc) && (FUN_14021b200(&DAT_14030aedc), DAT_14030aedc == -1)
     ) {
    local_d8 = 8;
    local_d0 = 0xf;
    local_e8 = 0x746c65426f6d7553;
    uStack_e0 = 0;
    DAT_14030aed8 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aedc);
  }
  if ((*(int *)(lVar14 + 4) < DAT_14030aee4) && (FUN_14021b200(&DAT_14030aee4), DAT_14030aee4 == -1)
     ) {
    uStack_e0 = 0;
    local_d8 = 3;
    local_d0 = 0xf;
    local_e8 = (ulonglong)(uint3)DAT_14025a754;
    DAT_14030aee0 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aee4);
  }
  if ((*(int *)(lVar14 + 4) < DAT_14030aeec) && (FUN_14021b200(&DAT_14030aeec), DAT_14030aeec == -1)
     ) {
    uStack_e0 = 0;
    local_d8 = 5;
    local_d0 = 0xf;
    local_e8 = (ulonglong)CONCAT14(s_Brain_14025a758[4],s_Brain_14025a758._0_4_);
    DAT_14030aee8 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aeec);
  }
  if ((*(int *)(lVar14 + 4) < DAT_14030aef4) && (FUN_14021b200(&DAT_14030aef4), DAT_14030aef4 == -1)
     ) {
    local_d8 = 8;
    local_d0 = 0xf;
    local_e8 = 0x7461654d6d657449;
    uStack_e0 = 0;
    DAT_14030aef0 = FUN_1400c1ff0(&local_e8);
    _Init_thread_footer(&DAT_14030aef4);
  }
  uVar25 = DAT_140258f88;
  fVar24 = fVar23;
  if (*(char *)(puVar10 + 0xb) != '\0') {
    FUN_1400c6320(DAT_14030aec8 + 1);
    fVar24 = DAT_140258f70;
  }
  fVar4 = DAT_1402bc568;
  fVar3 = DAT_140258348;
  uVar26 = (undefined4)((ulonglong)uVar12 >> 0x20);
  uVar20 = uVar22;
  if (0 < *(int *)((longlong)puVar10 + 0x54)) {
    do {
      FUN_1400c6320(DAT_14030aec8,fVar24 + fVar3,uVar25);
      uVar26 = (undefined4)((ulonglong)uVar12 >> 0x20);
      fVar24 = fVar24 + fVar4;
      uVar19 = (int)uVar20 + 1;
      uVar20 = (ulonglong)uVar19;
    } while ((int)uVar19 < *(int *)((longlong)puVar10 + 0x54));
  }
  fVar7 = DAT_14025a7b4;
  uVar5 = DAT_140258364;
  fVar4 = DAT_14025835c;
  if (*(char *)(puVar10 + 0xc) != '\0') {
    FUN_1400c6320(DAT_14030aed0,fVar24 + DAT_14025a7b4,DAT_140258364);
    fVar24 = fVar24 + fVar4;
  }
  if (*(char *)((longlong)puVar10 + 0x61) != '\0') {
    FUN_1400c6320(DAT_14030aed0 + 1,fVar24 + fVar7,uVar5);
    fVar24 = fVar24 + fVar4;
  }
  if (*(char *)((longlong)puVar10 + 0x62) != '\0') {
    FUN_1400c6320(DAT_14030aed0 + 2,fVar24 + fVar7,uVar5);
    fVar24 = fVar24 + fVar4;
  }
  if (*(char *)((longlong)puVar10 + 99) != '\0') {
    FUN_1400c6320(DAT_14030aed0 + 3,fVar24 + fVar7,uVar5);
    fVar24 = fVar24 + fVar4;
  }
  if (0 < *(int *)((longlong)puVar10 + 0x5c)) {
    FUN_1400c6320(DAT_14030aed8);
    if (1 < *(int *)((longlong)puVar10 + 0x5c)) {
      puVar13 = (undefined8 *)FUN_140086ba0(&local_e8,&DAT_1402bba14);
      if (0xf < (ulonglong)puVar13[3]) {
        puVar13 = (undefined8 *)*puVar13;
      }
      uVar12 = CONCAT44(uVar26,fVar8);
      FUN_14007f0f0(DAT_14030e508,fVar24 + fVar3,uVar25,0,uVar12,DAT_1402e8ad8,puVar13);
      uVar26 = (undefined4)((ulonglong)uVar12 >> 0x20);
      if (0xf < local_d0) {
        if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
          _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
        }
        thunk_FUN_14023e310();
      }
    }
    fVar24 = fVar24 + fVar23;
  }
  cVar9 = FUN_1400afd30(*(undefined8 *)(param_1 + 0x270));
  if (cVar9 != '\0') {
    FUN_1400c6320(DAT_14030aee8);
    fVar24 = fVar24 + fVar23;
  }
  fVar3 = DAT_140258f50;
  if (*(int *)(*(longlong *)(param_1 + 0x270) + 0x24c) == 2) {
    FUN_1400c6320(DAT_14030aef0,fVar24 + DAT_14025834c,uVar25);
  }
  if (*(char *)((longlong)puVar10 + 0x6c) != '\0') {
    FUN_1400c6320(DAT_14030aee0);
  }
  FUN_14007f0f0(DAT_14030e510);
  lVar14 = *(longlong *)(param_1 + 0x270);
  if (*(int *)(lVar14 + 0x1c) == 6) {
    iVar18 = DAT_14030aec0 + 5;
  }
  else {
    if (*(int *)(lVar14 + 0x1fc) == 0) {
      FUN_1400c6320(DAT_14030aec0);
      goto LAB_140056fbe;
    }
    if (*(int *)(lVar14 + 0x1fc) < *(int *)(lVar14 + 0x200)) {
      FUN_140086ba0(&local_e8,&DAT_1402bba14);
      FUN_14007f0f0(DAT_14030e508);
      if (0xf < local_d0) {
        if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
          _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
        }
        thunk_FUN_14023e310();
      }
      FUN_140086ba0(&local_e8,&DAT_14025a768);
      FUN_14007f0f0(DAT_14030e508);
      if (0xf < local_d0) {
        if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
          _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
        }
        thunk_FUN_14023e310();
      }
      goto LAB_140056fbe;
    }
    iVar18 = DAT_14030aec0 + 1;
  }
  FUN_1400c6320(iVar18);
LAB_140056fbe:
  if (0 < *(int *)(puVar10 + 10)) {
    FUN_14007f0f0(DAT_14030e510);
    FUN_140086ba0(&local_e8,&DAT_1402bba14);
    FUN_14007f0f0(DAT_14030e508);
    if (0xf < local_d0) {
      if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
        _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
      }
      thunk_FUN_14023e310();
    }
  }
  uVar20 = uVar22;
  uVar21 = uVar22;
  if (0 < *(int *)(*(longlong *)(param_1 + 0x270) + 0x200) + -1) {
    do {
      FUN_1400c41b0((float)(int)uVar21 + fVar23);
      uVar19 = (int)uVar20 + 1;
      uVar20 = (ulonglong)uVar19;
      uVar21 = (ulonglong)((int)uVar21 + 3);
    } while ((int)uVar19 < *(int *)(*(longlong *)(param_1 + 0x270) + 0x200) + -1);
  }
  FUN_14007f0f0(DAT_14030e510);
  FUN_14007f0f0(DAT_14030e510);
  FUN_140086ba0(&local_e8,&DAT_14025a77c);
  FUN_14007f0f0(DAT_14030e508);
  if (0xf < local_d0) {
    if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
      _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
    }
    thunk_FUN_14023e310();
  }
  FUN_1400afcf0(*(undefined8 *)(param_1 + 0x270));
  FUN_140086ba0(&local_e8,&DAT_1402bba14);
  FUN_14007f0f0(DAT_14030e508);
  if (0xf < local_d0) {
    if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
      _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
    }
    thunk_FUN_14023e310();
  }
  if ((*(int *)(puVar10 + 9) != -1) ||
     (fVar24 = DAT_140258fb8, *(int *)((longlong)puVar10 + 0x4c) != -1)) {
    FUN_14007f0f0(DAT_14030e510);
    if ((*(int *)(puVar10 + 9) == -1) ||
       (lVar14 = FUN_1400c03d0(), *(longlong *)(lVar14 + 0x10) == 0)) {
      FUN_14007f0f0(DAT_14030e518);
    }
    else {
      FUN_1400c03d0(*(undefined4 *)(puVar10 + 9));
      FUN_1400c05d0(*(undefined4 *)(puVar10 + 9));
      FUN_14007f0f0(DAT_14030e518);
    }
    if ((*(int *)((longlong)puVar10 + 0x4c) == -1) ||
       (lVar14 = FUN_1400c03d0(), *(longlong *)(lVar14 + 0x10) == 0)) {
      FUN_14007f0f0(DAT_14030e518);
      fVar24 = DAT_140258fd4;
    }
    else {
      FUN_1400c03d0(*(undefined4 *)((longlong)puVar10 + 0x4c));
      FUN_1400c05d0(*(undefined4 *)((longlong)puVar10 + 0x4c));
      FUN_14007f0f0(DAT_14030e518);
      fVar24 = DAT_140258fd4;
    }
  }
  if (puVar10[0xe] != puVar10[0xf]) {
    uVar12 = CONCAT44(uVar26,fVar8);
    FUN_14007f0f0(DAT_14030e510);
    fVar7 = DAT_14025a7f8;
    uVar26 = (undefined4)((ulonglong)uVar12 >> 0x20);
    fVar24 = fVar24 + fVar4;
    lVar14 = puVar10[0xe];
    uVar20 = uVar22;
    if (puVar10[0xf] - lVar14 >> 2 != 0) {
      do {
        uVar25 = (undefined4)((ulonglong)uVar12 >> 0x20);
        iVar18 = (int)uVar22;
        if ((*(int *)(uVar20 + lVar14) == -1) ||
           (lVar14 = FUN_1400c03d0(), *(longlong *)(lVar14 + 0x10) == 0)) {
          iVar17 = 0x4a;
          if (iVar18 < 5) {
            iVar17 = 0xc;
          }
          uVar12 = CONCAT44(uVar25,fVar8);
          FUN_14007f0f0(DAT_14030e518,(float)iVar17 + fVar23,fVar24,0,uVar12,DAT_1402e8a7c,"Unknown"
                       );
        }
        else {
          lVar14 = FUN_1400c03d0(*(undefined4 *)(puVar10[0xe] + uVar20));
          uVar15 = FUN_1400c05d0(*(undefined4 *)(puVar10[0xe] + uVar20));
          iVar17 = 0x4a;
          if (iVar18 < 5) {
            iVar17 = 0xc;
          }
          uVar12 = CONCAT44(uVar25,fVar8);
          FUN_14007f0f0(DAT_14030e518,(float)iVar17 + fVar23,fVar24,0,uVar12,
                        *(undefined4 *)(&DAT_14030ae80 + (longlong)*(int *)(lVar14 + 0x44) * 4),
                        uVar15);
        }
        uVar26 = (undefined4)((ulonglong)uVar12 >> 0x20);
        fVar24 = fVar24 + fVar3;
        if (iVar18 == 4) {
          fVar24 = fVar24 + fVar7;
        }
        uVar22 = (ulonglong)(iVar18 + 1U);
        lVar14 = puVar10[0xe];
        param_1 = local_res8;
        uVar20 = uVar20 + 4;
      } while ((ulonglong)(longlong)(int)(iVar18 + 1U) < (ulonglong)(puVar10[0xf] - lVar14 >> 2));
    }
  }
  pfVar16 = (float *)FUN_1400ad040(*(undefined8 *)(param_1 + 0x270),&local_res8);
  fVar23 = (float)(*(uint *)(param_1 + 0x114) ^ DAT_1402bc5d0);
  fVar23 = fVar23 + fVar23;
  FUN_1400c8550(CONCAT44(fVar23 * pfVar16[1] + DAT_14025a7d0,fVar23 * *pfVar16 + _DAT_14025a7f0));
  FUN_1400b5e20(*(undefined8 *)(param_1 + 0x270));
  FUN_1400c86d0();
  FUN_1400ce9a0(param_1,0,0);
  lVar14 = *(longlong *)(param_1 + 0x60);
  if (*(char *)(lVar14 + 0x335) != '\0') {
    FUN_1400c41b0();
    uVar12 = CONCAT44(uVar26,DAT_1402e8ad0);
    FUN_1400c41b0(*(float *)(lVar14 + 0x30c) + fVar8,*(float *)(lVar14 + 0x310) + fVar8,
                  *(float *)(lVar14 + 0x314) - fVar6,*(float *)(lVar14 + 0x318) - fVar6,uVar12);
    uVar25 = (undefined4)((ulonglong)uVar12 >> 0x20);
    puVar10 = (undefined8 *)FUN_140086ba0(&local_e8,&DAT_14025a7ac);
    if (0xf < (ulonglong)puVar10[3]) {
      puVar10 = (undefined8 *)*puVar10;
    }
    FUN_14007f0f0(DAT_14030e508,*(float *)(lVar14 + 0x30c) + DAT_140258344,
                  *(float *)(lVar14 + 0x310) + DAT_140258f4c,0,CONCAT44(uVar25,fVar8),DAT_1402e8ac0,
                  puVar10);
    if (0xf < local_d0) {
      if ((0xfff < local_d0 + 1) && (0x1f < (local_e8 - *(longlong *)(local_e8 - 8)) - 8)) {
                    /* WARNING: Subroutine does not return */
        _invoke_watson((wchar_t *)0x0,(wchar_t *)0x0,(wchar_t *)0x0,0,0);
      }
      thunk_FUN_14023e310();
    }
  }
  return;
}
