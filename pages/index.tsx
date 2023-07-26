import Image from 'next/image'
import { Fragment, useState, useEffect } from 'react'
import { useChain, useManager } from '@cosmos-kit/react';
// import { WalletStatus } from '@cosmos-kit/core';
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useLazyQuery } from '@apollo/client';
import { XMarkIcon, Squares2X2Icon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { DropZone, DragItem, Intro, GagScene } from '../components'
import NftImage from '../components/nft-image'
import { Fire } from '../components/fire'
import Scene from '../components/gag-test'
import { GagTvRendered } from '../components/gag-tv-rendered'
import {GagFoot} from '../components/gag-foot'
import {Test2} from '../components/gag-test-2'
import {
  chainName,
  OWNEDTOKENS,
  getHttpUrl,
} from '../config'

function getLogFromError(str) {
  const rgx = /Log:(?:[a-zA-Z ])+/g
  const found = rgx.exec(str)
  if (!found || found.length <= 0) return null
  return `${found[0]}`.replace('Log: ', '')
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txProcessing, setTxProcessing] = useState(false);
  const [open, setOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [errors, setErrors] = useState([])
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState([])
  const [filterInput, setFilterInput] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [activeTab, setActiveTab] = useState(1)
  const [activeView, setActiveView] = useState(1)
  const [getOwnedTokens, ownedTokensQuery] = useLazyQuery(OWNEDTOKENS);
  const [dynImgs, setDynImgs] = useState([])

  // dynamic wallet/client connections
  const manager = useManager()
  const { address } = useChain(chainName)

  function handleDragStart(event) {
    setActiveId(event.active.id)
    setIsPaused(true)
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && over.id === 'dropzone') {
      setAvailable(prev => {
        // const n = prev.filter(p => p.token_id != active.id.token_id)
        const n = prev.filter(p => `${p.collection_addr}${p.token_id}` != `${active.id.collection_addr}${active.id.token_id}`)
        return n
      })
      setSelected(prev => {
        // TODO: Change to token_id && contract
        if (![...prev].map(p => `${p.collection_addr}${p.token_id}`).includes(`${active.id.collection_addr}${active.id.token_id}`)) prev.push(active.id)
        return prev
      })
      setActiveId(null)
    }
  }

  function removeItem(item) {
    setOpen(true)
    setSelected(prev => {
      const n = prev.filter(p => `${p.collection_addr}${p.token_id}` != `${item.collection_addr}${item.token_id}`)
      return n
    })
    setAvailable(prev => {
      if (![...prev].map(p => `${p.collection_addr}${p.token_id}`).includes(`${item.collection_addr}${item.token_id}`)) prev.push(item)
      return prev
    })
  }

  function handleFilter(e) {
    setFilterInput(`${e.target.value}`.toLowerCase())
  }

  const filterByInputText = (item) => {
    if (!filterInput) return true
    if (`${item.name}`.toLowerCase().includes(filterInput) || `${item.token_id}`.toLowerCase().includes(filterInput)) {
      return true
    }
  }

  function setTab(id) {
    if (activeTab != id) setActiveTab(p => p = id)
  }

  const getOwnedNFTs = async () => {
    if (!address) return;
    getOwnedTokens({
      variables: {
        owner: address,
        // filterForSale: null,
        // sortBy: "PRICE_ASC",
        limit: 100
      },
    })
  }

  const getExternalNfts = async () => {
    if (ownedTokensQuery?.data?.tokens?.tokens) {
      // adjust output for better UI facilitation
      const { tokens } = ownedTokensQuery.data.tokens
      const adjustedTokens: any[] = tokens.map(tkn => {
        let t = { ...tkn }
        t.collection_addr = t.collectionAddr
        t.token_id = t.tokenId
        return t
      })
      
      setAvailable(adjustedTokens)
    }
  }

  useEffect(() => {
    getExternalNfts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedTokensQuery.data]);

  useEffect(() => {
    // console.log('selected', selected);
    const nftUrls = [...selected].map(s => getHttpUrl(s.imageUrl))

    setDynImgs(nftUrls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, available]);

  const getData = async () => {
    setIsLoading(true);
    await Promise.all([getOwnedNFTs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!address) return;
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const burnNotice = async () => {
    const burnMsgs = []
    setErrors([])

    // loop all the selected NFTs and append burn msgs
    selected.forEach(item => {
      if (item.collection_addr) burnMsgs.push({
        contractAddress: `${item.collection_addr}`,
        msg: {
          burn: {
            token_id: `${item.token_id}`
          }
        }
      })
    })
    if (burnMsgs.length <= 0) return;
    console.log('burnMsgs,', burnMsgs);
    setTxLoading(true)
    // setTxProcessing(true)
    // setIsPaused(false)
    // return;

    const repo = manager.getWalletRepo(chainName)
    if (repo.isWalletDisconnected) await repo.connect(repo.wallets[0].walletName, true)
    if (!repo.current?.address) {
      // TODO: setCurrentView(TransferView.Error)
      return;
    }
    const wallet = repo.getWallet(repo.wallets[0].walletName)
    const senderAddr = repo.current?.address
    if (!senderAddr || !wallet) {
      // TODO: setCurrentView(TransferView.Error)
      return;
    }
    const signerClient = await wallet.getSigningCosmWasmClient();
    try {
      const res = await signerClient.executeMultiple(`${senderAddr || address}`, burnMsgs, 'auto', '🔥 It!')
      console.log('signerClient res', res)
      if (res?.transactionHash) {
        setTxLoading(false)
        setTxProcessing(true)
        setTimeout(() => {
          setTxProcessing(false)
          setIsPaused(false)
        }, 2000)
        setTimeout(() => {
          setIsPaused(true)
          setSelected([])
          setErrors([])
        }, 10000)
      } else {
        setErrors(['Transaction could not complete correctly, try again'])
      }
    } catch (e) {
      // display error UI
      console.error('signingCosmWasmClient e', e)
      setIsPaused(true)
      setTxProcessing(false)
      setTxLoading(false)
      setErrors([getLogFromError(e)])

      setTimeout(() => {
        setErrors([])
      }, 10000)
    }
  }

  return (
    <div className="full-height relative">
      <div className="absolute z-0 overflow-hidden h-full w-full">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      <div className="relative p-0 pb-10 flex flex-col text-center w-full h-full">

        {activeView == 1 && !open && (
          <Intro openDialog={() => setOpen(true)} />
        )}
        
        {/* {activeView == 1 && open && (
          <GagScene imgs={dynImgs} isPaused={isPaused} />
        )} */}
        {/* <GagFoot imgs={dynImgs} isPaused={isPaused} /> */}

        {activeView == 1 && open && (
          <GagTvRendered imgs={dynImgs} isPaused={isPaused} />
        )}

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <DragOverlay>
            {
              activeId ? (
                <NftImage uri={activeId.imageUrl} alt={activeId.name} name={activeId.name} token_id={activeId.token_id} />
              ) : null}
          </DragOverlay>
          <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={setOpen}>

              <div className="fixed inset-0 top-24">
                <div className="absolute inset-0">
                  <div className="pointer-events-none fixed top-24 inset-y-0 right-0 flex max-w-full pl-10">
                    <Transition.Child
                      as={Fragment}
                      enter="transform transition ease-in-out duration-500 sm:duration-700"
                      enterFrom="translate-x-full"
                      enterTo="translate-x-0"
                      leave="transform transition ease-in-out duration-500 sm:duration-700"
                      leaveFrom="translate-x-0"
                      leaveTo="translate-x-full"
                    >
                      <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                        <div className="flex h-full flex-col bg-black pt-6 shadow-xl">
                          <div className="px-4 sm:px-6">
                            <div className="flex items-start justify-between">
                              <Dialog.Title className="text-base font-semibold leading-6 text-gray-100">
                                Your NFTs
                              </Dialog.Title>
                              <div className="ml-3 flex h-7 items-center">
                                <button
                                  type="button"
                                  className="rounded-md bg-black text-gray-400 hover:text-gray-500 outline-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-0"
                                  onClick={() => setOpen(false)}
                                >
                                  <span className="sr-only">Close panel</span>
                                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 pb-4 border-b border-zinc-800">
                            <div className="flex justify-between px-6">
                              <div className="flex-1">
                                <div className="relative rounded-md shadow-sm">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-zinc-500 dark:text-zinc-400 sm:text-sm">
                                      <MagnifyingGlassIcon className="m-auto w-4 h-4" />
                                    </span>
                                  </div>
                                  <input aria-describedby="" className="block w-2/3 rounded bg-white shadow-sm dark:bg-zinc-900 sm:text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-pink-500 focus:ring-0 focus:ring-offset-0 border-zinc-300 focus:border-zinc-300 dark:border-zinc-800 dark:focus:border-zinc-800 pl-9" id="nft_filter" type="text" autoComplete="on" placeholder="Filter by name or id" defaultValue="" onChange={handleFilter} />
                                </div>
                              </div>
                              <nav className="flex cursor-pointer">
                                <div onClick={() => setTab(1)} className={
                                  activeTab == 1 ? 'flex text-white bg-pink-600 rounded-l whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-pink-600' : 'flex text-white rounded-l hover:bg-zinc-800 whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-zinc-800'
                                }>
                                  <Squares2X2Icon className="m-auto w-4 h-4"/>
                                </div>
                                <div onClick={() => setTab(2)} className={
                                  activeTab == 2 ? 'flex text-white bg-pink-600 rounded-r whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-pink-600' : 'flex text-white rounded-r hover:bg-zinc-800 whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-zinc-800'
                                }>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 -0.5 21 21" className="m-auto h-4 w-4 p-[1px]"><path fillRule="evenodd" d="M16.8 18h2.1v-2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2Zm-9.45 4h2.1v-2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2ZM2.1 18h2.1v-2H2.1v2Zm2.1-4H2.1C.94 14 0 14.895 0 16v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2Zm12.6-3h2.1V9h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2Zm-9.45 4h2.1V9h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2ZM2.1 11h2.1V9H2.1v2Zm2.1-4H2.1C.94 7 0 7.895 0 9v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2Zm12.6-3h2.1V2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2ZM9.45 4h2.1V2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2ZM2.1 4h2.1V2H2.1v2Zm2.1-4H2.1C.94 0 0 .895 0 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2Z"></path></svg>
                                </div>
                              </nav>
                            </div>
                          </div>

                          {errors.length > 0 && (
                            <div className="py-4 border-b border-zinc-800">
                              <div className="rounded-md bg-red-900 mx-6 p-4">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <XCircleIcon className="h-5 w-5 text-red-100" aria-hidden="true" />
                                  </div>
                                  <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-100">There {errors.length > 1 ? `were ${errors.length} errors` : 'was an error'} with your transaction</h3>
                                    <div className="mt-2 text-sm text-red-300">
                                      <ul role="list" className="list-disc space-y-1 pl-5">
                                        {errors.map((err, idx) => (
                                          <li key={idx}>{err}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {(available.length > 0 && !txLoading && !txProcessing) && (
                            <div className="relative flex-1 px-6 py-4 overflow-y-scroll">
                              <ul role="list" className={
                                activeTab == 2 ? 'gap-4 grid grid-cols-3 items-start justify-start p-0' : 'gap-4 grid grid-cols-2 items-start justify-start p-0'
                              }>
                                {available.filter(filterByInputText).map((item, idx) => (
                                  <li className="flex overflow-hidden rounded w-full h-full" key={`${idx}`}>
                                    <DragItem id={item}>
                                      <NftImage uri={item.imageUrl} alt={item.name} name={item.name} token_id={item.token_id} />
                                    </DragItem>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {isLoading && (
                            <div className="relative flex-1 flex p-4 overflow-y-scroll min-h-full">
                              <div className="w-full my-auto text-center">
                                <div className="text-8xl -hue-rotate-90 gelatine">⚡️</div>
                                <h3 className="mt-2 text-lg font-semibold text-gray-100 animate-pulse">Loading NFTs...</h3>
                              </div>
                            </div>
                          )}

                          {(!available.length && !isLoading) && (
                            <div className="relative flex-1 flex p-4 overflow-y-scroll min-h-full">
                              <div className="w-full my-auto text-center">
                                <div className="text-6xl grayscale">😭</div>
                                <h3 className="mt-2 text-lg font-semibold text-gray-100">No NFTs</h3>
                                <p className="mt-2 text-sm text-gray-500">Go get some on the marketplace already!</p>
                                <div>
                                  <a href="" className="mt-8 button-3d text-white uppercase tracking-wider">
                                    Stargaze Market
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          {txLoading && (
                            <div className="relative flex-1 flex p-4 overflow-y-scroll min-h-full">
                              <div className="w-[75%] m-auto text-center">
                                <div className="text-6xl -hue-rotate-60 gelatine-slow">🔥</div>
                                <h3 className="mt-2 text-lg font-semibold text-gray-100 animate-pulse">Confirm Transaction</h3>
                                <p className="mt-2 text-sm text-gray-500">Please review the details in your wallet. Upon completion, your NFTs will be burned!</p>
                              </div>
                            </div>
                          )}

                          {txProcessing && (
                            <div className="relative flex-1 flex p-4 overflow-y-scroll min-h-full">
                              <div className="w-[75%] m-auto text-center">
                                <div className="">
                                  <Fire />
                                </div>
                                <h3 className="mt-2 text-lg font-semibold text-gray-100 animate-pulse">Burning...</h3>
                                <p className="mt-2 text-sm text-gray-500">Processing your transaction, please be patient.</p>
                              </div>
                            </div>
                          )}
                          
                          
                          {selected.length > 0 && (
                            <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-5 sm:px-6">
                              <div className="flex justify-end space-x-3">
                                <button
                                  type="submit"
                                  className="inline-flex justify-center rounded-md w-full bg-pink-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                                  onClick={() => burnNotice()}
                                >
                                  Start the Burn!
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </div>

              {(available.length && !txLoading && !txProcessing && isPaused) && (
                <DropZone id="dropzone">
                  {/* <div className="flex gap-4 grid grid-cols-5"> */}
                  <div className="flex flex-wrap justify-start pt-12">
                    {selected.map((item) => (
                      <div key={item.imageUrl} className="max-w-[100px] -skew-y-6 float-shadow">
                        <NftImage uri={item.imageUrl} alt={item.name} removeCallback={() => removeItem(item)} />
                      </div>
                    ))}
                  </div>
                </DropZone>
              )}

            </Dialog>
          </Transition.Root>
        </DndContext>

      </div>
      
    </div>
  );
}
