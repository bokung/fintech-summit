/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  CarbonCreditMarketplace,
  CarbonCreditMarketplaceInterface,
} from "../../../contracts/CarbonCreditMarketPlace.sol/CarbonCreditMarketplace";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "carbonCreditAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "xrplTokenAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "CreditListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "CreditSold",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "offerPrice",
        type: "uint256",
      },
    ],
    name: "buyCredit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "carbonCreditContract",
    outputs: [
      {
        internalType: "contract CarbonCredit",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creditsForSale",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllListingsSortedByPrice",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        internalType: "struct CarbonCreditMarketplace.MarketItem[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "listCreditForSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "marketplaceBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "xrplToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50604051611b24380380611b248339818101604052810190610032919061015e565b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555033600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505061019e565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061012b82610100565b9050919050565b61013b81610120565b811461014657600080fd5b50565b60008151905061015881610132565b92915050565b60008060408385031215610175576101746100fb565b5b600061018385828601610149565b925050602061019485828601610149565b9150509250929050565b611977806101ad6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806376e4fc2a1161006657806376e4fc2a146101475780638da5cb5b14610165578063af8a7d4b14610183578063c8e6b511146101a1578063ee18f865146101bd5761009e565b8063150b7a02146100a3578063155dd5ee146100d35780631bea6d0b146100ef5780635030025a1461010b5780636477057014610129575b600080fd5b6100bd60048036038101906100b89190610f50565b6101ed565b6040516100ca9190611013565b60405180910390f35b6100ed60048036038101906100e8919061102e565b610202565b005b6101096004803603810190610104919061105b565b6104bd565b005b610113610723565b60405161012091906110aa565b60405180910390f35b6101316107c5565b60405161013e9190611124565b60405180910390f35b61014f6107eb565b60405161015c9190611160565b60405180910390f35b61016d61080f565b60405161017a919061118a565b60405180910390f35b61018b610835565b6040516101989190611292565b60405180910390f35b6101bb60048036038101906101b6919061105b565b6109b4565b005b6101d760048036038101906101d2919061102e565b610c29565b6040516101e491906110aa565b60405180910390f35b600063150b7a0260e01b905095945050505050565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610292576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161028990611337565b60405180910390fd5b600081116102d5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102cc906113a3565b60405180910390fd5b80600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610331919061118a565b602060405180830381865afa15801561034e573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061037291906113d8565b10156103b3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103aa90611477565b60405180910390fd5b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16846040518363ffffffff1660e01b8152600401610434929190611497565b6020604051808303816000875af1158015610453573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061047791906114f8565b9050806104b9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104b090611571565b60405180910390fd5b5050565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461054d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161054490611337565b60405180910390fd5b3073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16636352211e846040518263ffffffff1660e01b81526004016105bd91906110aa565b602060405180830381865afa1580156105da573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105fe91906115a6565b73ffffffffffffffffffffffffffffffffffffffff1614610654576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161064b90611645565b60405180910390fd5b8060036000848152602001908152602001600020819055506005600083815260200190815260200160002060009054906101000a900460ff166106e757600482908060018154018082558091505060019003906000526020600020016000909190919091505560016005600084815260200190815260200160002060006101000a81548160ff0219169083151502179055505b817f91d53ed1c97ceb5553eb20a1d2b5f39c70e717f5e262b08dc113cf2539ceeca88260405161071791906110aa565b60405180910390a25050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161077f919061118a565b602060405180830381865afa15801561079c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107c091906113d8565b905090565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6060600080600090505b6004805490508110156108a2576000600360006004848154811061086657610865611665565b5b90600052602060002001548152602001908152602001600020541115610895578180610891906116c3565b9250505b808060010191505061083f565b5060008167ffffffffffffffff8111156108bf576108be61170b565b5b6040519080825280602002602001820160405280156108f857816020015b6108e5610e33565b8152602001906001900390816108dd5790505b5090506000805b6004805490508110156109a15760006004828154811061092257610921611665565b5b9060005260206000200154905060006003600083815260200190815260200160002054905060008111156109925760405180604001604052808381526020018281525085858151811061097857610977611665565b5b6020026020010181905250838061098e906116c3565b9450505b505080806001019150506108ff565b506109ab82610c41565b81935050505090565b60006003600084815260200190815260200160002054905060008111610a0f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a0690611786565b60405180910390fd5b80821015610a52576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a49906117f2565b60405180910390fd5b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401610ab393929190611812565b6020604051808303816000875af1158015610ad2573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610af691906114f8565b905080610b38576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b2f90611895565b60405180910390fd5b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166342842e0e3033876040518463ffffffff1660e01b8152600401610b9593929190611812565b600060405180830381600087803b158015610baf57600080fd5b505af1158015610bc3573d6000803e3d6000fd5b5050505060006003600086815260200190815260200160002081905550610be984610d42565b837fe7f9c58d2fd3189caffe5680ec0c0ecb1dc6cc45739dae8b5ca5a65dc522e9d03385604051610c1b929190611497565b60405180910390a250505050565b60036020528060005260406000206000915090505481565b6000600190505b8151811015610d3e576000828281518110610c6657610c65611665565b5b6020026020010151905060008290505b600081118015610cb35750816020015184600183610c9491906118b5565b81518110610ca557610ca4611665565b5b602002602001015160200151115b15610d105783600182610cc691906118b5565b81518110610cd757610cd6611665565b5b6020026020010151848281518110610cf257610cf1611665565b5b60200260200101819052508080610d08906118e9565b915050610c76565b81848281518110610d2457610d23611665565b5b602002602001018190525050508080600101915050610c48565b5050565b60006005600083815260200190815260200160002060006101000a81548160ff02191690831515021790555060005b600480549050811015610e2f578160048281548110610d9357610d92611665565b5b906000526020600020015403610e225760046001600480549050610db791906118b5565b81548110610dc857610dc7611665565b5b906000526020600020015460048281548110610de757610de6611665565b5b90600052602060002001819055506004805480610e0757610e06611912565b5b60019003818190600052602060002001600090559055610e2f565b8080600101915050610d71565b5050565b604051806040016040528060008152602001600081525090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610e8282610e57565b9050919050565b610e9281610e77565b8114610e9d57600080fd5b50565b600081359050610eaf81610e89565b92915050565b6000819050919050565b610ec881610eb5565b8114610ed357600080fd5b50565b600081359050610ee581610ebf565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f840112610f1057610f0f610eeb565b5b8235905067ffffffffffffffff811115610f2d57610f2c610ef0565b5b602083019150836001820283011115610f4957610f48610ef5565b5b9250929050565b600080600080600060808688031215610f6c57610f6b610e4d565b5b6000610f7a88828901610ea0565b9550506020610f8b88828901610ea0565b9450506040610f9c88828901610ed6565b935050606086013567ffffffffffffffff811115610fbd57610fbc610e52565b5b610fc988828901610efa565b92509250509295509295909350565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b61100d81610fd8565b82525050565b60006020820190506110286000830184611004565b92915050565b60006020828403121561104457611043610e4d565b5b600061105284828501610ed6565b91505092915050565b6000806040838503121561107257611071610e4d565b5b600061108085828601610ed6565b925050602061109185828601610ed6565b9150509250929050565b6110a481610eb5565b82525050565b60006020820190506110bf600083018461109b565b92915050565b6000819050919050565b60006110ea6110e56110e084610e57565b6110c5565b610e57565b9050919050565b60006110fc826110cf565b9050919050565b600061110e826110f1565b9050919050565b61111e81611103565b82525050565b60006020820190506111396000830184611115565b92915050565b600061114a826110f1565b9050919050565b61115a8161113f565b82525050565b60006020820190506111756000830184611151565b92915050565b61118481610e77565b82525050565b600060208201905061119f600083018461117b565b92915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6111da81610eb5565b82525050565b6040820160008201516111f660008501826111d1565b50602082015161120960208501826111d1565b50505050565b600061121b83836111e0565b60408301905092915050565b6000602082019050919050565b600061123f826111a5565b61124981856111b0565b9350611254836111c1565b8060005b8381101561128557815161126c888261120f565b975061127783611227565b925050600181019050611258565b5085935050505092915050565b600060208201905081810360008301526112ac8184611234565b905092915050565b600082825260208201905092915050565b7f4f6e6c7920746865206f776e65722063616e20706572666f726d20746869732060008201527f616374696f6e0000000000000000000000000000000000000000000000000000602082015250565b60006113216026836112b4565b915061132c826112c5565b604082019050919050565b6000602082019050818103600083015261135081611314565b9050919050565b7f416d6f756e74206d757374206265203e20300000000000000000000000000000600082015250565b600061138d6012836112b4565b915061139882611357565b602082019050919050565b600060208201905081810360008301526113bc81611380565b9050919050565b6000815190506113d281610ebf565b92915050565b6000602082840312156113ee576113ed610e4d565b5b60006113fc848285016113c3565b91505092915050565b7f4e6f7420656e6f756768205852504c20746f6b656e7320696e20636f6e74726160008201527f6374000000000000000000000000000000000000000000000000000000000000602082015250565b60006114616022836112b4565b915061146c82611405565b604082019050919050565b6000602082019050818103600083015261149081611454565b9050919050565b60006040820190506114ac600083018561117b565b6114b9602083018461109b565b9392505050565b60008115159050919050565b6114d5816114c0565b81146114e057600080fd5b50565b6000815190506114f2816114cc565b92915050565b60006020828403121561150e5761150d610e4d565b5b600061151c848285016114e3565b91505092915050565b7f5769746864726177207472616e73666572206661696c65640000000000000000600082015250565b600061155b6018836112b4565b915061156682611525565b602082019050919050565b6000602082019050818103600083015261158a8161154e565b9050919050565b6000815190506115a081610e89565b92915050565b6000602082840312156115bc576115bb610e4d565b5b60006115ca84828501611591565b91505092915050565b7f4d61726b6574706c61636520646f6573206e6f74206f776e207468697320637260008201527f6564697400000000000000000000000000000000000000000000000000000000602082015250565b600061162f6024836112b4565b915061163a826115d3565b604082019050919050565b6000602082019050818103600083015261165e81611622565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006116ce82610eb5565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611700576116ff611694565b5b600182019050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f437265646974206e6f7420666f722073616c6500000000000000000000000000600082015250565b60006117706013836112b4565b915061177b8261173a565b602082019050919050565b6000602082019050818103600083015261179f81611763565b9050919050565b7f4f6666657220707269636520697320746f6f206c6f7700000000000000000000600082015250565b60006117dc6016836112b4565b91506117e7826117a6565b602082019050919050565b6000602082019050818103600083015261180b816117cf565b9050919050565b6000606082019050611827600083018661117b565b611834602083018561117b565b611841604083018461109b565b949350505050565b7f5852504c20746f6b656e207472616e73666572206661696c6564000000000000600082015250565b600061187f601a836112b4565b915061188a82611849565b602082019050919050565b600060208201905081810360008301526118ae81611872565b9050919050565b60006118c082610eb5565b91506118cb83610eb5565b92508282039050818111156118e3576118e2611694565b5b92915050565b60006118f482610eb5565b91506000820361190757611906611694565b5b600182039050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603160045260246000fdfea2646970667358221220a80dd8aebd2ff822caac7f795bfde147a9025793c830848f6f4a87e590ee111964736f6c634300081c0033";

type CarbonCreditMarketplaceConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CarbonCreditMarketplaceConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CarbonCreditMarketplace__factory extends ContractFactory {
  constructor(...args: CarbonCreditMarketplaceConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    carbonCreditAddress: AddressLike,
    xrplTokenAddress: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      carbonCreditAddress,
      xrplTokenAddress,
      overrides || {}
    );
  }
  override deploy(
    carbonCreditAddress: AddressLike,
    xrplTokenAddress: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(
      carbonCreditAddress,
      xrplTokenAddress,
      overrides || {}
    ) as Promise<
      CarbonCreditMarketplace & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): CarbonCreditMarketplace__factory {
    return super.connect(runner) as CarbonCreditMarketplace__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CarbonCreditMarketplaceInterface {
    return new Interface(_abi) as CarbonCreditMarketplaceInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): CarbonCreditMarketplace {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as CarbonCreditMarketplace;
  }
}
