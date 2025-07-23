'use-client'

import { AppDial } from "@/components/app-dial"

const DAMAGE_EXAMPLE =  {
  primaryDamage: {
    type: 'melee',
    targets: 1,
    range: {
      minimum: 0,
      maximum: 14,
    }
  },
  secondaryDamage: {
    type: 'energetic',
    targets: 3,
    range: {
      minimum: 0,
      maximum: 12,
    }
  }
}

const HEAT_EXAMPLE =  {
  primaryDamage: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  },
  secondaryDamage: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  },
  movement: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  }
}

const EXAMPLE = {
  marker: {
    hasMarker: true,
    markerColor: "#009000"
  },
  values: {
    primaryAttack:  +3,
    secondaryAttack: 10,
    movement: 10,
    attack: 10,
    defense: 1
  },
  colors: {
    primaryAttack: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    secondaryAttack: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    movement: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    attack: {
      hasCollor: true,
      collorHex: "#f2f",
      singleUse: false,
    },
    defense: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    }
  }
}


export default function List() {
  return(
    <div className="flex flex-row w-full items-center justify-center">
      <AppDial
        heatClick={HEAT_EXAMPLE}
        dialSide="stats"
        frontArc={270}
        rearArc={90}
        name={`Vulture Mk IV 'Le Yuan [Paradise]'`}
        unique={true}
        points={"211"}
        variant="VTR-V1-H"
        rank="Elite"
        ventRating={2}
        damageTypes={DAMAGE_EXAMPLE}
        click={EXAMPLE}
      />
    </div>
  ) 
}