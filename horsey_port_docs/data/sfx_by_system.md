# 音效事件清单（按系统归类）

来源：`data/sound.xml` 的 486 条事件名。事件名即开发者写代码时给动作起的名字，
是玩法系统最密集、最不容易造假的单一证据源。

> 注：同一事件名出现多次代表有多个变体（例如 `Horse` 有 51 个变体、`SmartHuman` 有 88 个），
> 下表已去重，保留的是**系统名**而非样本数。

## locations  (16)

  EnterLocationBiohacker  EnterLocationCarLot     EnterLocationCircus     EnterLocationCrispr     EnterLocationGlue       EnterLocationHome       EnterLocationMart       EnterLocationPaddock
  EnterLocationPowerPlant  EnterLocationSaloon     EnterLocationStable     EnterLocationSumo       EnterLocationTent       EnterTent               Paddock                 Stable

## ai_controllers  (14)

  SmartAlligator          SmartCar                SmartCow                SmartDino               SmartDog                SmartDuck               SmartGiraffe            SmartHorse
  SmartHuman              SmartInsect             SmartLeprechaun         SmartMoose              SmartRabbit             SmartTiger

## grab_items  (29)

  GrabApple               GrabBale                GrabBallAndChain        GrabBalloon             GrabBeer                GrabBriefcase           GrabCactus              GrabCarcass
  GrabCard                GrabClothing            GrabClownNose           GrabDisk                GrabDung                GrabFlowers             GrabFossil              GrabGATC
  GrabGlasses             GrabHay                 GrabHorse               GrabHotSauce            GrabPlutonium           GrabRacingStripes       GrabRamBar              GrabRocket
  GrabStilts              GrabSuspensionLift      GrabTrophy              GrabVial                GrabWatch

## race  (16)

  ConveyorStart           CrossFinishLine         Drumroll                Gong                    GongWood                GongWoodLight           LoseMoney               LoseRace
  OnYourMark              RaceGetSet              RaceGo                  SimStartRace            StartDNAExtract         StartGeneDrive          StartNextRace           WonRace

## betting  (8)

  BetMax                  BetMore                 Betting                 GainMoney               LoseMoney               NotEnoughMoney          OpenPrize               PrizeAppear

## crispr_sim  (26)

  BalloonSimFaster        BalloonSimSlower        Cas9Motor               Crispr                  EnterLocationCrispr     GrabDisk                GrabVial                HelixAttach
  HelixPluck              InsertDisk              Mutate                  ProcessHorse            SampleDNA               SimHorseFinished        SimSavingToDisk         SimSpawnDisk
  SimStartRace            StartDNAExtract         StartGeneDrive          SwitchToExtract         SwitchToGeneDrive       VialExplode             VialFill                VialWorld
  VialZoomIn              VialZoomOut

## hoof_gear  (7)

  Hoof                    HoofRollerblades        HoofSneakers            HoofStilts              LiftOn                  RamOn                   StripesOn

## stable_chores  (16)

  BarnDoorClose           BarnDoorOpen            BarnMating              Dig                     DigFinish               DigLoop                 Dung                    DungInCart
  FencePlace              FillHole                GrabBale                GrabDung                GrabHay                 SmashFence              Sweep                   VialFill

## circus  (12)

  Bounce                  Cannon                  Circus                  CircusTimpani           Clapping                CurtainClose            CurtainOpen             EnterLocationCircus
  EnterLocationTent       EnterTent               LoneClap                Tent

## power  (12)

  EnterLocationPowerPlant  GongWoodLight           GrabSuspensionLift      HorseTouchingTurbine    JetEngineLoop           LiftOff                 LiftOn                  LightsOn
  PowerOff                PowerOn                 PowerPlant              TurbineSpin

## wildlife  (25)

  Alligator               Cow                     Dino                    Dog                     Duck                    Fish                    Giraffe                 Human
  Insect                  Leprechaun              Moose                   Rabbit                  SmartAlligator          SmartCow                SmartDino               SmartDog
  SmartDuck               SmartGiraffe            SmartHuman              SmartInsect             SmartLeprechaun         SmartMoose              SmartRabbit             SmartTiger
  Tiger

## sumo  (4)

  EnterLocationSumo       ImpactHard              SmashFence              SumoBattle

## truck  (20)

  BriefcaseOpen           Car                     CarLot                  DungInCart              EnterLocationCarLot     GarageDoorOpen          GrabBriefcase           GrabCarcass
  GrabCard                Honk                    SmartCar                TitleCard               TruckEnterLocation      TruckIdle               TruckLeaveLocation      TruckMotor
  TruckPotholeIn          TruckPotholeOut         UnzoomTruck             ZoomTruck

## ui  (31)

  AttachItem              BarnDoorClose           BarnDoorOpen            BiohackerDoorOpen       BriefcaseOpen           Check                   CloseNews               ComputerBeep
  ComputerCopy            ComputerMenu            ComputerPaste           CurtainClose            CurtainOpen             Dialog                  DropHorseFail           GarageDoorOpen
  HelixAttach             JustSwitch              LerpHorse               LockBreak               LockRattle              OpenNews                OpenPrize               PutOnShelf
  SelectInv               SwitchToExtract         SwitchToGeneDrive       Uncheck                 VialZoomIn              VialZoomOut             ZoomTruck
