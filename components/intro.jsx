import { useChain } from '@cosmos-kit/react';
import { WalletStatus } from '@cosmos-kit/core';
import { chainName } from '../config';
import {
  BoltIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

const exampleNFTs = []

for (let i = 1; i < 8; i++) {
  exampleNFTs.push(`/nfts/${i}.jpg`)
}

// TY: https://codepen.io/jkantner/pen/gKRKKb
export function Intro({ openDialog }) {
  let btnTitle = 'Load NFTs'
  let btnType = 'load'
  const {
    connect,
    // openView,
    status,
  } = useChain(chainName);

  // Events
  const onClickConnect = async (e) => {
    e.preventDefault();
    await connect();
  };

  const onClickOpenView = (e) => {
    e.preventDefault();
    // openView();
    openDialog();
  };

  let onClick;
  if (
    status === WalletStatus.Disconnected ||
    status === WalletStatus.Rejected
  )
    onClick = onClickConnect;
  else {
    btnTitle = 'Start Burnin\''
    btnType = 'fire'
    onClick = onClickOpenView;
  }

  return (
    <div className="overflow-hidden h-full text-left">
      <div className="mx-auto">
        <div className="mx-auto grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">

          <div className="w-[48rem] h-[70vh] my-auto">
            <div className="relative min-h-full w-full">
              <div className="absolute top-[16em] left-[30%]">
                <img src="/couch.svg" alt="burner" width="350" height="230" />
              </div>
              <ul role="list" className="absolute h-full w-full p-0" style={({ left: 'calc(50% - 120px)' })}>
                {exampleNFTs.map((src, i) => (
                  <li className="inline-flex burner" key={src} id={`burner-${i}`}>
                    <img className="pointer-events-none rounded bg-gray-50 m-0" src={src} />
                  </li>
                ))}
              </ul>
              <div className="fire">
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
              </div>
            </div>
          </div>
          <div className="my-auto">
            <div className="lg:max-w-xl">
              <h2 className="text-base font-semibold leading-7 text-pink-600">Burn, Baby, Burn</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl">Burn NFTs</p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                You've always wanted to clear out those unwanted NFTs. Maybe they got spam dropped? Maybe you want to make a collection more rare? Be bad, light a match under those digital collectibles.
              </p>
              <br/>
              <button className="button-3d" onClick={onClick}>
                {btnType == 'load' && (<BoltIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />)}
                {btnType == 'fire' && (<FireIcon className="flex-shrink-0 w-5 h-5 mr-2 text-white" />)}
                {btnTitle}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}