import Image from 'next/image'
import { Fragment, useState, useEffect } from 'react'
import { useChain, useManager } from '@cosmos-kit/react';
// import { WalletStatus } from '@cosmos-kit/core';
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useLazyQuery } from '@apollo/client';
import { XMarkIcon, Squares2X2Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { DropZone, DragItem, Intro } from '../components'
import NftImage from '../components/nft-image'
import {
  chainName,
  OWNEDTOKENS,
} from '../config'

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState([])
  const [filterInput, setFilterInput] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [activeTab, setActiveTab] = useState(1)
  const [activeView, setActiveView] = useState(1)
  const [getOwnedTokens, ownedTokensQuery] = useLazyQuery(OWNEDTOKENS);

  // dynamic wallet/client connections
  const manager = useManager()
  const { address } = useChain(chainName)

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && over.id === 'dropzone') {
      setAvailable(prev => {
        const n = prev.filter(p => p.imageUrl != active.id.imageUrl)
        return n
      })
      setSelected(prev => {
        if (![...prev].map(p => p.imageUrl).includes(active.id.imageUrl)) prev.push(active.id)
        return prev
      })
      setActiveId(null)
    }
  }

  function removeItem(item) {
    setOpen(true)
    setSelected(prev => {
      const n = prev.filter(p => p.imageUrl != item.imageUrl)
      return n
    })
    setAvailable(prev => {
      if (![...prev].map(p => p.imageUrl).includes(item.imageUrl)) prev.push(item)
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
      console.log('adjustedTokens', adjustedTokens);
      
      setAvailable(adjustedTokens)
    }
  }

  useEffect(() => {
    getExternalNfts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedTokensQuery.data]);

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
      const res = await signerClient.executeMultiple(senderAddr || address, burnMsgs, 'auto', '🔥 It!')
      console.log('signerClient res', res)
      // TODO:
      // if (res?.transactionHash) {
      //   setCurrentIbcStep(1)

      //   // TODO: Change to wait 10-30s for receive confirm (check receiver is owner)
      //   // Check packet status for a few seconds before attempting Self-relay
      //   setTimeout(() => {
      //     setCurrentView(TransferView.RequiresRelayer)
      //   }, 2000)
      // }
    } catch (e) {
      // display error UI
      console.error('signingCosmWasmClient e', e)
      // setCurrentView(TransferView.Error)
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

        {/* TODO: Scene */}

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
                          
                          {selected.length > 0 && (
                            <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-5 sm:px-6">
                              <div className="flex justify-end space-x-3">
                                {/* <button
                                type="button"
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                onClick={() => setOpen(false)}
                              >
                                Cancel
                              </button> */}
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

              <DropZone id="dropzone">
                <div className="flex gap-4 grid grid-cols-5">
                  {selected.map((item) => (
                    <div key={item.imageUrl}>
                      <NftImage uri={item.imageUrl} alt={item.name} name={item.name} token_id={item.token_id} removeCallback={() => removeItem(item)} />
                    </div>
                  ))}
                </div>
              </DropZone>

            </Dialog>
          </Transition.Root>
        </DndContext>

      </div>
      
    </div>
  );
}
