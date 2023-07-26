import { Fragment, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useDroppable } from '@dnd-kit/core'
import {
  SquaresPlusIcon
} from '@heroicons/react/24/outline';

export function DropZone(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });
  const base = 'relative flex flex-col w-full h-full transition-all rounded-2xl border-4 border-dashed border-pink-600 p-12 text-center hover:border-pink-700 focus:outline-none'
  const classes = isOver
    ? `${base} border-pink-300`
    : base

  return (
    <Transition.Child
      as={Fragment}
      enter="ease-in-out duration-500"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in-out duration-500"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed flex flex-col inset-0 top-24 right-[32rem] p-12 bg-gray-500/0 bg-opacity-75 transition-opacity">
        <div ref={setNodeRef} className={classes}>
          {
            props.children.props.children.length > 0 ? '' : (
              <div className="my-auto flex flex-col text-centered">
                <SquaresPlusIcon className="w-24 h-24 text-pink-600 mx-auto" />
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-200 sm:text-4xl"> Drag & Drop </p>
                <p className="mt-6 text-lg leading-8 text-gray-400"> Select an NFT in your collection and drag here! </p>
              </div>
            )
          }
        </div>

        {
          props.children.props.children.length > 0 ? (
            <div>
              {props.children}
            </div>
          ) : ''
        }
      </div>
    </Transition.Child>
  )
}